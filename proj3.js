/*
Name: Christopher Will
CS 316 Project 3
*/

//Require the following modules
var paul = require('/homes/paul/HTML/CS316/p3_req.js');
var http = require("http")
var url = require('url');

const fs = require('fs');
const child_process = require('child_process'); 
//the 2 status codes to be used
const validFile = 200;
const fileNotFound = 404;


//Select a random port in 7000 and 10001
var randomPort = Math.floor(Math.random() * (paul.pend() - paul.pstart())) + paul.pstart(); 
	/*I referenced the follwing URL to create a random port in the correct bounds:
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random*/


//helper function to listen on the given port and host
function mylisten(server, port, host, logger){
	logger(port, host); //output the current port and hostname to the console
        server.listen(port, host);//listen on the above port and host name
}

function myprocess(request, response) {
	var xurl = request.url; // the user's URL
	var validURL = /^\/[a-zA-Z0-9_]+\.html$|^\/[a-zA-Z0-9_]+\.php$|^\/[a-zA-Z0-9_]+\.cgi$/;
	
	if(validURL.test(xurl)){
		handleUserFile(xurl, response); //user gave valid file so serve it 
	}else{
		response.statusCode = fileNotFound;
		response.end(xurl + " is not a valid URL"); //file was not of the correct form
	}	
}

//create a server and listen for requests on the given port and host
var server = http.createServer(myprocess);
mylisten(server, randomPort, paul.phost(), paul.logger);

//determine what kind of the file the user gave and serve it to the browser
function handleUserFile(userFile, response){
        response.setHeader('Content-Type', 'text/html');
	var fileSize = userFile.length;
	/*Determine which file the user gave based on the last letter
	in the file name*/
	var htmlFile = "l";
	var phpFile = "p";

	/*call 1 of 3 functions to serve the users file to browser, 
	passing their url and the server.response as parameters*/
	if(userFile[fileSize - 1] == htmlFile){
		processHTML(userFile, response); //user gave .html file 
	}else if(userFile[fileSize - 1] == phpFile){
		//call php function
		processPHP(userFile, response); //user gave .php file
	}else{
		//call cgi function
		processCGI(userFile, response); //user gave .cgi file
	}
}

function processCGI(userFile, response){
        /*only execute .cgi files located in the ./MYCGI directory 
	found below our current directory*/
	userFile = "./MYCGI" + userFile;
	var fileContents;// the output of serving the users .cgi file to the browser
	
	if(!(fs.existsSync(userFile))){//the given file does not exist under ./MYCGI/
		fileContents = userFile + " does not exist or cannot be read";
		response.statusCode = fileNotFound;
		response.end(fileContents);
		return;//set the status code to 404, and output that the file does not exist to the browser
	}

	var cgiPath = "./MYCGI/";
	var myEnv = {'PATH': cgiPath};//set $PATH to look only for files in the ./MYCGI/ directory
	child_process.exec(userFile, {env:myEnv}, function(error, stdout, stderr){
		if(error){
			fileContents = error.stack; //file has an error exectuing 
		}else{
			fileContents = stdout + stderr;//file was executed properly
		}
		response.statusCode = validFile; /* set the status code to 200 and output 
					to the browser the result of executing the user's file*/
		response.end(fileContents);});	
}

function processPHP(userFile, response){	
	var whatPHP = paul.whatphp();
	var PHPpath = paul.ppath();
	var myEnv = {'PATH': PHPpath};
	var fileContents;//hold the output from executing the users file
	
	userFile = "./MYHTML" + userFile; /*only execute .php files located in the
						MYHTML/ directory below the current directory*/
	if(!(fs.existsSync(userFile))){//the .php file does not exist
		fileContents = userFile + " does not exist or cannot be read";
		response.statusCode = fileNotFound;
		response.end(fileContents);
		return;//set the status code to 404 and return an error message to the broswer
	}

	child_process.exec(whatPHP + " " + userFile, {env:myEnv},function(error, stdout, stderr){
		if(error){
			fileContents = error.stack;//the file had an error while executing
		}else{
			fileContents = stdout + stderr;//file executed normally
		}
		response.statusCode = validFile;
		response.end(fileContents);}); /*set the status code to valid and return the output
						of executing the user's file*/
}

function processHTML(userFile, response){
	/*We only execute .html files found in the MYHTML/
	directory located below the current directory*/
	userFile = "./MYHTML" + userFile;
	var fileContents;
        
	if(fs.existsSync(userFile)){
		response.statusCode = validFile;
		fileContents = fs.readFileSync(userFile);
		/*User file exists so set status code to 200 and serve the files output to the browser*/
	}else{
		fileContents = userFile + " does not exist or cannot be read.";
		response.statusCode = fileNotFound;/*User's file does not exist so set the status code to 400
						and serve an error message to the browser*/
	}
	response.end(fileContents);	
}
