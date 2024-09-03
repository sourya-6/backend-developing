class ApiError extends error{
    constructor(
        statusCode,
        message="OOPS SOMETHING WRONG BRO!!",
        errors=[],
        statck
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.error=errors
        this.message=message
        this.success=false

        if(stack){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this,constructor)
        }
        
    }
}

export{ApiError}