const conn = require('./conn');

function Meeting() {};

Meeting.prototype = {
    create: function(body, callback){
        var bind = [];
        for(prop in body){
            bind.push(prop)
        }
        let sql = "INSERT INTO meetings (meeting_id, host) VALUES (?, ?)";
        conn.query(sql, bind, function(err, lastId){
            if(err) throw err;
            callback(lastId)
        })
    }
}