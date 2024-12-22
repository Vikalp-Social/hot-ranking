function handleError(res, error){
    console.log(error.code);
    if(error.code === 'ENOTFOUND'){
        res.status(502).json({
            error: "Can't Establish a connection to the server",
            status: 502,
            statusText: "Bad Gateway",
        });
    } else {
        res.status(400).json({
            error: error.response.data.error,
            status: error.response.status,
            statusText: error.response.statusText,
        });
    }
}

export default handleError;