function Timeline (data) {
	this.data = data;
	this.idx = {"points":{}, "rows":{}, "clickTargets":{}};
	this.minimised = false;
	this.minamisable = true;

	this.c = {
		currentRow:0
	};

	this.config = {
		startDate: 0,
		elementHeight: 50,
		elementWidth: 50,
		lineWidth: 1,
		rowSpacing: 10,
		stepWidth:40,
		pointSize:8,
		points: {
			max: 34,
			min:8,
			loadedColor: "#FC4C36",
			defaultColor: "#fff"
		},
		topBorder: 30,
		leftBorder:0,

		minimiseHeight:200,

		grid: {
			lineWidth:0.5,
			lineColor: "#ccc",
			major: {
				color: "#aaa",
				width: 1
			},
			majorLineInterval: 5,

			yearNumbers: {
				font: {
					family:   'Helvetica',
					size:     12,
					anchor:   'middle',
					leading:  '1.5em'
				},
				color: "#666"
			}
		},
	};

	this.callbacks = {timeChange:[],timelineChange:[],dataChange:[]};

	this.setupPlayback();
}

function encode_as_img_and_link(){
	 var svg = $("#timeline").html();
	 var b64 = Base64.encode(svg); // or use btoa if supported

	 // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
	 $("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>"));
}

Timeline.prototype.drawTimeline = function(element) {
	this.element = element;
	this.range = [this.data[0].startTime,this._latestTime(this.data)];
	this.rows = this._rowCount(this.data);
	this.steps = 35;
	this.height = (this.rows * (this.config.elementHeight + this.config.rowSpacing*2)) + this.config.topBorder + 50;
	this.width = ((this.range[1]-this.range[0]+1)*(this.config.stepWidth))+this.config.leftBorder;
	this.minHeight = (this.config.elementHeight + this.config.rowSpacing*2);
	this.draw = SVG(element).size(this.width,this.height);
	this.draw.viewbox(0,0,this.width,this.height);


	this.chart = this.draw.group();
	this.chart.attr('id','chart');
	this.plotGroup = this.chart.group();
	this.plotGroup.attr('id','plot');
	this.mm = this.minMaxValue(this.data[0]);
	console.log("Min: "+this.mm[0]+" Max: "+this.mm[1]);
	
	this.drawBase();
	this.processTimeline(this.data);

	//this.clickBind();
};

Timeline.prototype._latestTime = function(data) {
	var largest = 0;
	for (var i in data) {
		if (data[i].children.length) {
			var c = this._latestTime(data[i].children);
			if (c>largest) {
				largest = c;
			}
		}
		if (data[i].endTime > largest) {
			largest = data[i].endTime;
		}
	}
	return largest;
};

Timeline.prototype.minMaxValue = function(data) {
	
	//for array
	arr = data.invStats;
	//console.log(arr);
	var min = Math.min.apply(null, arr);
    var max = Math.max.apply(null, arr);
    ///console.log("ID: "+data.ID+", Max: " + max);
   // console.log("ID: "+data.ID+", Min: " + min);
    //console.log(arr);
    var mm = [min,max];

	//for each child call the function, base case is to ignore this
	for (var i=0; i<data.children.length; i++) {
		//compare
		mmChild = this.minMaxValue(data.children[i]);
		if (mm[0] > mmChild[0]) {mm[0] = mmChild[0]}; //min
		if (mm[1] < mmChild[1]) {mm[1] = mmChild[1]}; //max
	}
	
	return mm;
}

Timeline.prototype._rowCount = function(data) {
	var count = 0;
	for (var i in data) {
		count++;
		if (data[i].children.length) {
			count += this._rowCount(data[i].children);
		}
	}
	return count;
}

Timeline.prototype.drawBase = function() {
	var underlay = this.plotGroup.group();
	underlay.attr('id','underlay');
	this.plotGroup.move(0,this.config.topBorder);

	//add header
	this.topAxisGroup = this.chart.group();
	this.topAxisGroup.attr('id','topAxis');

	
	var y = 30;
	var y2 = this.height;
	var xSkip = 0.5*this.config.elementWidth;

	for (i=0; i<=this.steps; i++) {
		var x = xSkip + (i*this.config.stepWidth) + this.config.leftBorder;
		
		//draw columns
		/*var column = underlay.rect(this.config.stepWidth,y2-y)
			column.move(x - (0.5*this.config.stepWidth),y);
			column.fill('#fff');
			column.attr('class','rowHover');
		*/

		//draw year lines
		var line = underlay.line(x,y,x,y2);
		line.stroke({width:this.config.grid.lineWidth,color:this.config.grid.lineColor});
		//highlight major intervals
		if (i%this.config.grid.majorLineInterval == 0) {
			line.stroke(this.config.grid.major);
		}

		//draw year numbers
		var year = this.config.startDate + i;
		var text = this.topAxisGroup.text(year.toString())
		text.font(this.config.grid.yearNumbers.font);
		text.fill(this.config.grid.yearNumbers.color);
		text.move(x,y);
		text.rotate(90);		
	}

	


	//draw shading
}

Timeline.prototype.nodeClick = function(evt) {
	var bbox = evt.bbox();
	this.minimise(bbox);
	this.selectLineage(evt);
}

Timeline.prototype.maximise = function() {
	if (this.minimised) {
		this.draw.animate(500, elastic).viewbox(0,0,this.width,this.height).size(this.width,this.height);
		this.minimised = false;
	}
}

Timeline.prototype.minimise = function(bbox) {
	//if it's already minimised, it's not a minimise action
	if (this.minimised)
		return false;

	console.log("minimising");

	//the top of the bounding box clicked is the top of our viewbox
	var top = bbox.y + 20;

	//animate viewbox and viewport simutaneously
	this.draw.animate(500, elastic).viewbox(0,top,this.width,this.minHeight).size(this.width,this.minHeight);
	this.minimised = true;
}

Timeline.prototype.selectLineage = function(target) {
	dateID = target.attr('href').replace("#tl",'').split('-');
	date = dateID[0]-this.config.startDate;
	id = dateID [1]; 

	this.setTimeline(id);
	this.setTime(date);
}


Timeline.prototype.processTimeline  = function(tData,parent) {
	//sort	

	for (i in tData) {
		var t = tData[i];

		if (parent) {
			var group = parent.group.group();
		} else {
			var group = this.plotGroup.group();
		}
		t.group = group;
		group.attr('id','group'+t.ID);

		this.idx.rows[t.ID] = group;
		
		//workout element coordinates
		this.c.currentRow++;
		var x = (t.startTime * this.config.stepWidth) + this.config.leftBorder;
		var y = ((this.config.elementHeight + this.config.rowSpacing) * this.c.currentRow);
		t.x = x;
		t.y = y;

		//draw time lines	
		var tX = x + (0.5*this.config.elementWidth);
		var tX2 = tX + ((t.endTime - t.startTime) * this.config.stepWidth)
		var tY = y + (0.5*this.config.elementHeight);
		var timeLine = group.line(tX,tY,tX2,tY).stroke({width:this.config.lineWidth});

		//draw connecting lines
		if (parent) {
			var thisX = x + (0.5*this.config.elementWidth);
			var thisY = y + (0.5*this.config.elementHeight);
			var parentX = thisX;
			var parentY = parent.y + (0.5*this.config.elementHeight);
			var dropLine = group.line(parentX,parentY,thisX,thisY).stroke({width:this.config.lineWidth});
		}

		//draw children
		if (t.children.length) {
			this.processTimeline(t.children,t);
		}
		
		//draw element last to be on top
		
		//draw pie
		var pieGroup = group.group();
		pieGroup.attr("class","pieGroup");
		
		this.drawPie(pieGroup,t);
		pieGroup.move(x,y);
		
		


		//draw points on timeline last to be above lines
		for(i=0;i <= (t.endTime - t.startTime); i++) {

			//initialise index for points
			if (i == 0) { this.idx.points[t.ID] = []; };

			//draw link target
			var link = group.link('#tl'+this.getDate(t,i)+'-'+t.ID);
			link.attr('class','clickTarget');
			link.attr('title', this.getDate(t,i));
			lnkID = this.makeID(t.ID,i);
			link.attr('id',lnkID);
			var controller = this;
			link.click(function(){
				controller.nodeClick.apply(controller,[this]);
			});
			var target = link.rect(this.config.stepWidth,this.config.elementHeight);
			var tarX = x + (i*this.config.stepWidth) + (0.5*this.config.elementWidth)-(0.5*this.config.stepWidth);
			var tarY = tY - (0.5*this.config.elementHeight);
			target.move(tarX,tarY);
			target.fill('#eee');
			//target.attr('class','clickTarget');			

			if (i !=0 ) {
				//var pointSize = this.config.points.min + ((i*rate/30) * (this.config.points.max - this.config.points.min));
				
				//default point state
				var pointSize = this.config.pointSize;
				var pointLoaded = false; 

				//set if point has loaded and calculate its size
				if (t.hasOwnProperty('invStats')) {
					if (t.invStats[i] > 0) {
						pointSize = this.config.points.min + (((t.invStats[i]-this.mm[0]) / (this.mm[1]-this.mm[0])) * (this.config.points.max - this.config.points.min));
						pointLoaded = true;
					}
				}

				//draw the point
				var circle = link.circle(pointSize);
				this.idx.points[t.ID][i] = circle;
				var cx = x+(0.5*this.config.elementWidth)+(i*this.config.stepWidth)-(0.5*pointSize);
				var cy = tY-(0.5*pointSize);
				circle.move(cx,cy);
				if (pointLoaded){
					circle.fill(this.config.points.loadedColor);
				} else {
					circle.fill(this.config.points.defaultColor);
				}
				//circle.stroke({color: '#000', width: this.config.lineWidth});

				var pointl = (pointLoaded == true ? " loaded":"");
				if ((i+parseInt(t.startTime))%this.config.grid.majorLineInterval != 0) {
					circle.attr('class','minorPoint'+pointl);
				} else {
					circle.attr('class','majorPoint'+pointl);
				}
			}			
		}
	}
};

Timeline.prototype.drawPie = function(group, data) {
	//console.log(data);
	if (data.hasOwnProperty("divisions")) {
		//do something
	} else {
		var rect = group.rect(this.config.elementWidth, this.config.elementHeight);
	}
}

Timeline.prototype.setLoaded = function(timeline,id,value) {
	
	//add to data
	tl = this.fetchTimeline(timeline);
	if (!tl) {console.log("couldn't find timeline ID");return false;}
	this._setInvasiveValue(tl,id,value)

	//get point element
	var point = this.idx.points[timeline][id];
	
	//set colour
	point.attr({ "fill": this.config.points.loadedColor});
	
	//rescale row
	if (!this._rescaleData()) {
		this._rowRescale(timeline, tl.invStats, true);
	}

	//add loaded class
	point.attr('class',point.attr('class') + ' loaded');

	//run callback
	this._onDataChange(timeline,id);
}

Timeline.prototype._rescaleData = function() {
	//update min max
	newMM = this.minMaxValue(this.data[0]);
	//console.log(newMM);

	//update scale or not
	if (newMM[0] != this.mm[0] || newMM[1] != this.mm[1]) {
		this.mm = newMM;

		//update each row
		for (id in this.idx.rows) {
			//console.log(id);
			//console.log(this.fetchTimeline(id));
			this._rowRescale(id, this.fetchTimeline(id).invStats,true);
		}

		//console.log('rescaled everything');
		return true;
	}

	//console.log('no rescale needed');
	return false;
}

Timeline.prototype._rowRescale = function(id, data, animate) {
	
	//error check
	if (!id || !data || !animate) {return false};

	//get min max
	minmax = {min:this.mm[0],max:this.mm[1]};

	//adjust nodes
	nodes = this.idx.points[id];
	//console.log(data);
	for(i in nodes) {
		size = this._scaleValue(this.config.points,minmax,data[i]);
		if (size != null) {
			nodes[i].animate(1000, elastic).size(size,size);
		}
	}
}

Timeline.prototype._scaleValue = function(range,minmax,value) {
	var size = range.min + (((value-minmax.min) / (minmax.max-minmax.min)) * (range.max - range.min));
	if (!size) {
		/*console.log("-------");
		console.log(range);
		console.log(minmax);
		console.log(value);
		console.log("-------");*/
		return null;
	}

	return size;
}
 function elastic(pos) {
    if (pos == !!pos) return pos
    	return Math.pow(2, -10 * pos) * Math.sin((pos - 0.075) * (2 * Math.PI) / .3) + 1;
  }

Timeline.prototype._setInvasiveValue = function(elem,id,value) {
	if (!elem.hasOwnProperty("invStats")) {
		elem.invStats = [];
		for (i=0; i<=elem.endTime-elem.startTime; i++) {
			elem.invStats.push(0);
		}
	} else if(elem.invStats.length == 0) {
		for (i=0; i<=elem.endTime-elem.startTime; i++) {
			elem.invStats.push(0);
		}
	}
	//console.log(elem);
	elem.invStats[parseInt(id)] = value;
}

Timeline.prototype.fetchTimeline = function(id) {
	return this._recursiveSearchData(id, this.data[0]);
}

Timeline.prototype._recursiveSearchData = function(id, elem) {
	if (elem.ID == id) {
		return elem;
	}

	//for children in elem
	for (i in elem.children) {
		//children search
		var child = this._recursiveSearchData(id,elem.children[i]);
		if (child) {
			return child;
		}
	}

	return false;
}

Timeline.prototype.reloadData = function(data) {

}

Timeline.prototype.makeID = function(timeline,id) {
	timeline = timeline.replace(".","_")
	return "tlNode" + timeline + "_" + id;
}

Timeline.prototype.getDate = function(data, i) {
	return this.config.startDate + i + parseInt(data.startTime);
}



Playback = function() {
	this.currentYear = 0;
	this.startYear = 0;
	this.endYear = 30;
	this.playbackSpeed = 200;
	this.loop = true;

	this.playing = false;

	this.callbacks;
}

Playback.prototype.stop = function() {
	this.playing = false;
}

Playback.prototype.play = function() {
	this.playing = true;

	if (this.currentYear >= this.endYear) {
		this.setYear(0);
		var that = this;
		setTimeout(function(){that.playback()},this.playbackSpeed);
	} else {
		this.playback();	
	}
}

Playback.prototype.playback = function() {
	if (this.playing) {

		console.log(this.currentYear);
		
		if (this.currentYear+1 <= this.endYear) {
			this.setTime(this.currentYear+1);

			var that = this;
			setTimeout(function(){that.playback()},this.playbackSpeed);
		} else {
			if (this.loop) {
				this.currentYear = this.startYear;
				this.setTime(this.currentYear);

				var that = this;
				setTimeout(function(){that.playback()},this.playbackSpeed);
			} else {
			    this.stop();
			}
		}
	}
}

Playback.prototype.setTime = function(val) {
	this.currentYear = val;
}



Timeline.prototype.setupPlayback = function() {
	this.time = null;
	this.timelineID = null;
	this.playback = new Playback();
}

///Playback component
Timeline.prototype.play = function() {
	this.playback.play();
}

Timeline.prototype.stop = function() {
	this.playback.stop();
}

Timeline.prototype.setTimeline = function(id) {
	this.timelineID = id;
	this._onTimelineChange(id);
}

Timeline.prototype.setTime = function(time) {
	this.time = time;
	this._onTimeChange(this.timelineID,time);

	//set time

}

//client side bind to time change
Timeline.prototype.onTimeChange = function(callback) {
	this.addCallbacks(this.callbacks,"timeChange",callback);
}

Timeline.prototype.onTimelineChange = function(callback) {
	this.addCallbacks(this.callbacks,"timelineChange",callback);
}

Timeline.prototype.onDataChange = function(callback) {
	this.addCallbacks(this.callbacks,"dataChange",callback);
}

Timeline.prototype._onDataChange = function(timelineID,time) {
	this.runCallbacks(this.callbacks,"dataChange",this,[timelineID,time]);
}

Timeline.prototype._onTimeChange = function(timelineID,time) {
	this.runCallbacks(this.callbacks,"timeChange",this,[timelineID,time]);
}

Timeline.prototype._onTimelineChange = function(timelineID) {
	this.runCallbacks(this.callbacks,"timelineChange",this,[timelineID]);
}




Timeline.prototype.addCallbacks = function(callbackDictionary,key,callback) {
	//console.log(callbackDictionary);
	callbackDictionary[key].push(callback);
}

Timeline.prototype.runCallbacks = function(callbackDictionary, key, context, args) {
	for (i in callbackDictionary[key]) {
		callbackDictionary[key][i].apply(context,args);
	}
}