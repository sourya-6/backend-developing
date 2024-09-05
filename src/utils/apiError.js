class ApiError extends error{
    constructor(
        statusCode,
        message="OOPS SOMETHING WRONG BRO!!",
        errors=[],
        stack
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.error=errors
        this.message=message
        this.success=false

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this,constructor)
        }
        
    }
}

export{ApiError}