var requestParams = {
  "add_expense":{
    "url":"https://httpbin.org/post",
    "options":{
      "method":"POST",
      "headers":{
        "Authorization":"xyz",
        "Content-Type":"application/json"
      }
    }
  }
}

module.exports = requestParams
