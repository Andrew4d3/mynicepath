/**
 * ViewController
 *
 * @description :: Server-side logic for managing views
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	login: function(req,res){
		return res.view("login");
	},
	map: function(req,res){
		return res.view("map");
	}
};

