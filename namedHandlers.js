var namedHandlers = {
    'Showmyhomework':function(){
      this.emit("GenericHandler")
    },
    'Homework':function(){
      this.emit("GenericHandler")
    },
    'Areyouarobot':function(){
      this.emit("GenericHandler")
    }
}
module.exports = namedHandlers
