const retryOperation = async(operation, retries, delay)=>{
    for(let attempt = 1; attempt <= retries; attempt++){
        try {
            return await operation()
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if(attempt == retries){
                throw error
            }
            await new Promise((res)=> setTimeout(res,delay))
            
        }
    }

}
module.exports = retryOperation