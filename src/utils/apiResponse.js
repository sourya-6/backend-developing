class ApiResponse{
    constructor(
        statusCode,message="succcess",data
    ){
        this.statusCode=statusCode
        this.message=message
        this.success=statusCode<400
    }
}
export{ApiResponse}