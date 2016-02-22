/**
 * AppController
 *
 * @description :: Server-side logic for managing apps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 

 
var thinky = require('thinky')();
var type = thinky.type;
var Promise = require('bluebird');
 
var User = thinky.createModel("User",{
    id: type.string(),
    username: type.string(),
    password: type.string()
});
 
var Path = thinky.createModel("Path",{
    id: type.string(),
    user_id: type.string(),
    name: type.string(),
    description: type.string(),
});
 
User.hasMany(Path,"paths","id","user_id");
Path.belongsTo(User,"user","user_id","id");
 
var Point = thinky.createModel("Point",{
    id: type.string(),
    path_id: type.string(),
    name: type.string(),
    description: type.string(),
    directions_next: type.string(),
    lat: type.number(),
    long: type.number(),
    order: type.number(),
    is_last: type.boolean()
});
 
Path.hasMany(Point,"points","id","path_id");
Point.belongsTo(Path,"path","path_id","id");

module.exports = {
    
    index: function(req,res){
		return res.send("Hello!");
	},
	
	singup: function(req,res){
		var username = req.body.username || null;
		var password = req.body.password || null;
		
		if(!username || !(username.length > 0 && username.length <= 45)){
			return res.status(500).send({
				msg: "Username invalid"
			});
		}
		
		if(!password || !(password.length > 0 && password.length <= 45)){
			return res.status(500).send({
				msg: "Password invalid"
			});
			
		}
		
		User.filter({username: username}).run()
		.then(function(result) {

			
			if(result.length){
		    	res.send({taken:true});
		    	return new Promise(function(resolve){
		    		resolve(null);	
		    	});
		    }
		    
		    var new_user = new User({
		    	username: username,
		    	password: password
		    });
		    
		    return new_user.save();
		    
		})
		.then(function(result){
			
			if(!result){
				return;
			}
			req.session.user = result;
			return res.send(result);
		});
	},

	singin: function(req,res){
		
		var username = req.body.username || null;
		var password = req.body.password || null;
		
		if(!username || !(username.length > 0 && username.length <= 45)){
			return res.status(500).send({
				msg: "Username invalid"
			});
		}
		
		if(!password || !(password.length > 0 && password.length <= 45)){
			return res.status(500).send({
				msg: "Password invalid"
			});
			
		}
		
		User.filter({
			username: username,
			password: password
		})
		.run().then(function(result){
			
			if(!result[0]){
				return res.send({bad_user:true});
			}
			
			req.session.user = result[0];
			
			var user = result[0];
			delete user.password;
			
			res.send(user);
			
		})
	},
	
	createPath: function(req,res){
		
		req.body.user_id = req.session.user.id;
		var newPath = new Path(req.body);
		
		newPath.points = req.body.points.map(function(point){
			return new Point(point);	
		});
		
		newPath.saveAll({points:true})
		.then(function(result){
			return res.send(result);	
		})
		.catch(function(err){
			return res.status(500).send(err);
		});
		
		
	},
	
	getPaths: function(req,res){
		
		Path.getJoin({
		    points: {
		        _apply: function(sequence) {
		            return sequence.orderBy('order').limit(1);
		        }
		    }
		})
		.run().then(function(paths){
			
			paths.forEach(function(path){
				path.start_point = path.points[0] || null,
				delete path.points;
			});
			
			return res.send(paths);
		})
		.catch(function(err){
			return res.status(500).send(err);
		});
	},
	
	getPath: function(req,res){
		
		Path.get(req.params.id).getJoin({
			user: true,
			points:{
				_apply: function(sequence) {
			       return sequence.orderBy('order');
			     }
			}
		})
		.then(function(path){
			return res.send(path);
		});
	},
	
	logout: function(req,res){
		req.session.user = false;
		return res.send({logout:true});
	}
};

