const User = require("../models/user");

// Function to update a user's watchlist by adding a symbol (without removal)
const updateWishlist = async (req, res) => {
  const { email, wishlistName, symbolId, id } = req.body;

  // Ensure the required parameters are present
  if (!email || !wishlistName || !symbolId) {
    return res.status(400).json({ error: 'Missing required fields: email, wishlistName, or symbolId' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
let watchlist;
    if (wishlistName === "favorites" || wishlistName === "blocklist") {
        // Otherwise, find by name
        watchlist = user.watchlists.find(wl => wl.name === wishlistName);
        // If it's one of these special names, find by id
       
      } else {
        watchlist = user.watchlists.find(wl => wl.id === id);
        
      }

    
    
    if (!watchlist) {
      // Create the new watchlist with the symbol
    if(id){
        await User.findOneAndUpdate(
            { email },
            { $push: { watchlists: {id: id , name: wishlistName, symbols: [symbolId] } } },
            { new: true }
          );
    }else{
        await User.findOneAndUpdate(
            { email },
            { $push: { watchlists: { name: wishlistName, symbols: [symbolId] } } },
            { new: true }
          );

    }
    } else if (!watchlist.symbols.includes(symbolId)) {
      // Add the symbol to the existing watchlist only if it's not already present
      await User.findOneAndUpdate(
        { email, "watchlists.name": wishlistName },
        { $addToSet: { "watchlists.$.symbols": symbolId } }, // Only adds if it doesn't already exist
        { new: true }
      );
    }

    // Fetch the updated user to send in response
    const updatedUser = await User.findOne({ email });
    return res.status(200).json({ message: 'Wishlist updated successfully', user: updatedUser });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while updating the wishlist' });
  }
};



const deleteWishlistSymbol = async (req, res) => {
    const { email, wishlistName, symbolId} = req.body;
  
    // Ensure the required parameters are present
    if (!email || !wishlistName || !symbolId) {
      return res.status(400).json({ error: 'Missing required fields: email, wishlistName, or symbolId' });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Find the watchlist by name
      const watchlist = user.watchlists.find(wl => wl.name === wishlistName);
      
      if (!watchlist) {
        return res.status(404).json({ error: 'Watchlist not found' });
      }
  
      // Check if the symbol exists in the watchlist
      if (!watchlist.symbols.includes(symbolId)) {
        return res.status(404).json({ error: 'Symbol not found in watchlist' });
      }
  
      // Remove the symbol from the watchlist
      await User.findOneAndUpdate(
        { email, "watchlists.name": wishlistName },
        { $pull: { "watchlists.$.symbols": symbolId } }, // Remove the symbol from the array
        { new: true }
      );
  
      // Fetch the updated user to send in response
      const updatedUser = await User.findOne({ email });
      return res.status(200).json({ message: 'Symbol removed from wishlist successfully', user: updatedUser });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while removing the symbol from the wishlist' });
    }
  };

  const getUserWishlist = async (req, res) => {
    const { email } = req.query;
  
    // Ensure the required parameter is present
    if (!email) {
      return res.status(400).json({ error: 'Missing required field: email' });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Return the user's watchlists
      return res.status(200).json({ watchlists: user.watchlists });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while retrieving the watchlists' });
    }
  };

module.exports = { updateWishlist,deleteWishlistSymbol,getUserWishlist };
