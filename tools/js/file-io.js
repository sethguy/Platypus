this.shell = (function () {
	if (typeof ActiveXObject != 'undefined') {
		return new ActiveXObject("wscript.shell");
	} else {
		var shell = {
		    Run: function (cmd, num, pause) {
		    	var args = cmd.split(' ');
		    	return runCommand.apply(this,args);
		    },
		    isBash: true
		};
		return shell;
	};
}());

if (typeof print === 'undefined') {
   	print = function (txt) {
   		WScript.Echo(txt);
   	};
}

this.fileSystem = (function () {
	if (typeof ActiveXObject != 'undefined') {
		var fso    = new ActiveXObject("Scripting.FileSystemObject"),
		strm       = new ActiveXObject("ADODB.Stream"),
		fileSystem = {
		    OpenTextFile: function (path) {
		    	strm.Open();
				strm.LoadFromFile(path);
		    	return {
		    		path: path,
		    		Close: function () {
		    			strm.Close();
		    		},
		    		ReadAll: function () {
		    			return strm.ReadText();
		    		},
		    		Write: function (str) {
		    			var bs = new ActiveXObject("ADODB.Stream");
		    			
		    			strm.WriteText(str);
		    			strm.Position = 3;
		    			
		    		    bs.Type = 1;
		    		    bs.Open();
		    		    strm.CopyTo(bs);
		    		    bs.SaveToFile(this.path, 2);
		    		    bs.Close();
		    			return str;
		    		}
		    	};
		    },
		    CreateTextFile: function (path, options) {
		    	strm.Open();
		    	return {
		    		path: path,
		    		Close: function () {
		    			strm.Close();
		    		},
		    		Write: function (str) {
		    			var bs = new ActiveXObject("ADODB.Stream");
		    			
		    			strm.WriteText(str);
		    			strm.Position = 3;
		    			
		    		    bs.Type = 1;
		    		    bs.Open();
		    		    strm.CopyTo(bs);
		    		    bs.SaveToFile(this.path, 2);
		    		    bs.Close();
		    			return str;
		    		}
		    	};
		    },
		    FileExists: function (path) {
		    	return fso.FileExists(path);
		    },
		    FolderExists: function (path) {
		    	return fso.FolderExists(path);
		    },
		    CreateFolder: function (path) {
		    	return fso.CreateFolder(path);
		    },
		    MoveFile: function (fromPath, toPath) {
		    	return fso.MoveFile(fromPath, toPath);
		    },
		    CopyFile: function (fromPath, toPath) {
		    	return fso.CopyFile(fromPath, toPath);
		    },
		    DeleteFile: function (path) {
		    	return fso.DeleteFile(path);
		    }
		};
		strm.CharSet = "utf-8";
		strm.Type    = 2;

		return fileSystem;
	} else {
		var file   = function (path) {
	    	this.path   = path;
	    	this.reader = undefined;
	    	this.writer = undefined;
	    	this.file   = undefined;
		},
		fileSystem = {
		    OpenTextFile: function (path) {
		    	return new file(path);
		    },
		    CreateTextFile: function (path) {
		    	return new file(path);
		    },
		    FileExists: function (path) {
		    	var file = java.io.File(path);
		    	return file.exists();
		    },
		    FolderExists: function (path) {
		    	var file = java.io.File(path);
		    	return file.isDirectory();
		    },
		    CreateFolder: function (path) {
		    	var file = java.io.File(path);
		    	return file.mkdirs();
		    },
		    MoveFile: function (fromPath, toPath) {
		    	var file = java.io.File(fromPath);
		    	return file.renameTo(new java.io.File(toPath));
		    },
		    CopyFile: function (fromPath, toPath) {
		    	return runCommand('bash', '-c', 'cp ' + fromPath + ' ' + toPath);
		    },
		    DeleteFile: function (path) {
		    	return runCommand('bash', '-c', 'rm ' + path);
		    	//Need to use runCommand, because JScript cannot handle a function named "delete"
//		    	var file = java.io.File(path);
//		    	return file.delete();
		    }
		},
		proto = file.prototype;
		
		proto.Close   = function () {
    		if (this.reader) this.reader.close();
    		if (this.writer) this.writer.close();
    	};
    	proto.ReadAll = function () {
	    	var line = undefined,
    		str      = '';
	    	
	    	if (!this.reader) {
	    		this.reader = new java.io.BufferedReader(new java.io.FileReader(this.path));
	    	}
	    	
	    	while ((line = this.reader.readLine()) != null) {
    		  str += new String(line) + '\n';
    		}
    		return str;
    	};
    	proto.Write = function (str) {
	    	if (!this.writer) {
	    		this.writer = new java.io.FileWriter(this.path);
	    	}
	    	
	    	this.writer.write(str);
	    	
    		return str;
    	};
		
	    return fileSystem;
	}
}());
