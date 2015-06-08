/* Servidor node convencional 

var http = require('http');

console.log('Server nodechat ON!');

http.createServer(function(req,res){
	res.writeHead(200,{"Content-Type":"text/html"});
	res.end('Server is still without any implementation');
}).listen(4444);

https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions/

*/

var express = require('express');			// framework para node
var bodyParser = require('body-parser');	// módulo para lectura de post
var eventos = require('events');			// eventos
var socket = require('socket.io');			// comunicación por sockets
var mongoose= require('mongoose');			// modelo de objetos para mongodb
var session = require('client-sessions');	// gestión de sesiones 

var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: 'ddffgk1112'
}));

/*********  Esquemas, modelos y métodos *******************/

var Schema = mongoose.Schema;

var userSchema = new Schema({
	nick: {type: String, required: true, unique: true},
	password: String
});
userSchema.methods.nickAlternative = function(){
	this.nick = this.nick + ((Math.random()*1000)+1);
};
var User = mongoose.model('User',userSchema);
var messageSchema = new Schema({
	nick: String,
	text: String,
	date: {type: Date, default: Date.now}
});
var Message = mongoose.model('Message',messageSchema);

mongoose.connect('mongodb://localhost/nodechat');
/********************************************************/


//var EmisorEventos = eventos.EventEmitter;
//var ee = new EmisorEventos();


app.chat = "welcome!\n";				// estado del chat actual
app.set('view engine', 'ejs');			// engine de templates ejs
app.set('views',__dirname + '/views');	// ubicación de las vistas / templates


// handlers

app.get('/', function(req,res){
	express.static(__dirname +'/public');	// rutas estáticas 
	req.session_state.reset();				
});



app.post('/login', function(req, res){
	console.log('login...');
	//if(req.session && req.session.nick){
	User.find({'nick': req.body.nick},function(err,users){
		console.log('login - ' + users);
		if(err) throw err;
		if (users.length>0){
			if (users[0]['password'] === req.body.pass) {		
				req.session_state.nick = req.body.nick;
				res.render('webchat',{'chat':app.chat, 'nick': req.session_state.nick});			
			}
			else{
				req.session_state.reset();
				res.redirect('/');
			}
		}
		
	});
	//}
});




app.get('/webchat', function(req,res){
	console.log('webchat - '+ req.session_state.nick);
	res.render('webchat', {'chat': app.chat,'nick': req.session_state.nick});
});


app.post('/webchat', function(req,res){
	var message = new Message({
		nick: req.session_state.nick,
		text: req.body.message
	})
	message.save(function(err){
			try{
			if (err) throw err;
			console.log('mensaje guardado');
		}
		catch(err){
			console.log('mensaje NO guardado');
		}
	});
		app.chat = app.chat + '\n' + req.session_state.nick +': '+req.body.message;

		console.log('...' + app.chat);
		console.log('>> ' + JSON.stringify(req.body.message));
		res.render('webchat', {'chat':app.chat, 'nick':req.session_state.nick});

		io.sockets.emit('newMsg',app.chat);
});




app.get('/showmessages',function(req,res){
	Message.find({},function(err,messages){
		if (err) throw err;
		console.log(messages);
		res.render('messages',{'messages':messages});
	});
});





app.get('/showusers', function(req,res){
	var userlist = User.find({}, function(err,users){
		if (err) throw err;
		console.log(users);
		res.render('users', {'userlist': users});
	});
	
});





app.post('/newuser', function(req,res){
	console.log("register> " + req.body.nick + ' ' + req.body.pass);
	var user = new User({
		nick: req.body.nick,
		password: req.body.pass
	});

	user.save(function(err){
		try{
			if (err) throw err;
			console.log('Usuario guardado!');
			res.redirect('/');
		}
		catch(err){
			console.log('Usuario no guardado');
			//res.render('error_newuser'); <-- Error: Can't set headers after they are sent.
		}
	});

});




var server = app.listen(4444, function(){
	console.log('Server ON');
});

var io = socket.listen(server);

