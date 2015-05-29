//just binds to the main timeline and follows it

MiniTimeline = function(element, timeline, config) {
	this.element = element;
	this.timeline = timeline;

	this.config = {
		width: 900,
		height: 60,

		lineHeight: 60,
		lrMin: 20,
		points: {
			max:22,
			min:5
		}
	}

	this.ID = "1.3.2.1.1";
}


MiniTimeline.prototype.draw = function() {
	this.svg = SVG(this.element).size(this.config.width, this.config.height);

	this.setupSeek()

	this.drawGrid();

	//setup node draw group
	this.nodes = this.svg.group("nodes")
	this.nodeSet = this.svg.set();
	this.updateTimeline();

	this.setupClick();



	//setup viewbox	
	var that = this;
	this.timeline.onDataChange(function() {
		that.updateTimeline();
	});

	//this.svg.on(window,'click', function(){console.log("click")});
}

MiniTimeline.prototype.setPlayTime = function() {

}

MiniTimeline.prototype.setupSeek = function() {
	var seekBar = this.svg.rect(this.config.width/2, this.config.lineHeight/3)
								.attr({
										"fill":"#D7D7D7",
										"opacity":0.9,

									})
								.move(this.config.lrMin,20);	
};

MiniTimeline.prototype.setupClick = function() {
	var clickHandler = this.svg.rect(this.config.width, this.config.height)
								.attr({
										"fill":"#ffffff",
										"opacity":0
									});
	clickHandler.click( function(mouse) {
		console.log(mouse.offsetX);
		console.log(mouse.offsetY);
		console.log("test");
		console.log(this);
	});

	console.log("click");
}

MiniTimeline.prototype.drawGrid = function() {
	try {

		if (this.timeline.hasOwnProperty("data")) {
			var grid = this.grid = this.svg.group("grid");
			
			var c = this.config;

			//get ticks
			var ticks = this.ticks = this.timeline.data[0].endTime - this.timeline.data[0].startTime +1;

			//set step spacing
			c.lineWidth = c.width - (c.lrMin*2);
			c.stepSpacing = c.lineWidth / (ticks-1);
			var centre = c.centre = c.height / 2;

			//add ticks		
			for (var i=0; i<ticks; i++) {
				// left padding + (i*spacing)
				var x = c.lrMin + (i*c.stepSpacing);
				grid.line(x, centre+(c.lineHeight/4), x, centre-(c.lineHeight/4))
					.stroke({ width: 1, color: "#bbb" });
			}


			//draw centre line			
			grid.line(c.lrMin, centre, c.lineWidth+c.lrMin, centre)
				.stroke({ width: 1 });

			//console.log(ticks);

		} else {
			throw "Timeline has no data";
		}




	} catch(e) {
		console.log(e);
	}
}

MiniTimeline.prototype.calculatePointSize = function(val) {
	if (val < 0 || val == undefined) return 0;
	return this.config.points.min + (((val-this.mm[0]) / (this.mm[1]-this.mm[0])) * (this.config.points.max - this.config.points.min));
}

MiniTimeline.prototype.updateTimeline = function() {
	try {
		if (this.timeline.hasOwnProperty("data")) {

			c = this.config;

			//build data array
			this.buildDataArray(this.ID);

			if (this.nodeSet.members.length == 0) {
				this.drawPoints();
			} else {
				for (i in this.nodeSet.members) {
					var pointSize = this.calculatePointSize(this.data[i]);
					this.nodeSet.members[i].animate(500, elastic).size(pointSize,pointSize);
				}
			}

		}
	} catch(e) {
		console.log(e);
	}
}

function elastic(pos) {
	if (pos == !!pos) return pos
	return Math.pow(2, -10 * pos) * Math.sin((pos - 0.075) * (2 * Math.PI) / .3) + 1;
}

MiniTimeline.prototype.drawPoints = function() {
	c = this.config;

	for (var i=0; i<this.ticks; i++) {
		//find value
		var pointSize = this.calculatePointSize(this.data[i]);

		//position on x axis
		var x = c.lrMin + (i*c.stepSpacing);

		//draw point
		var node = this.nodes.circle(pointSize)
							.move(x-(pointSize/2),c.centre-(pointSize/2))
							.fill("#fc4c36");

		//add to set
		this.nodeSet.add(node);
	}
}

MiniTimeline.prototype.buildDataArray = function(ID) { 
	var objectStack = this.findByID(ID, this.timeline.data[0], []);
	objectStack.reverse();
	//console.log(objectStack);

	var values = [];

	for (var i in objectStack) {
		var obj = objectStack[i];
		var start = parseInt(obj.startTime);
		var end = parseInt(obj.endTime);

		//console.log("Start: " + start + ", End: " + end);

		for (var j=start; j<= end; j++) {
			if (obj.invStats.length > j-start) {
				values[j] = parseInt(obj.invStats[j-start]);
			} else {
				values[j] = -1;
			}
		}
		//console.log(obj.invStats);
		//console.log(values);
	}

	this.data = values;

	//calculate min max
	this.mm = this.minMaxValue(this.data);


	//console.log(values);
	//console.log(this.mm);
	return values;
}

MiniTimeline.prototype.findByID = function(searchID, object, arr) { 
	//console.log(object.ID);
	//bottom case
	if (object.ID == searchID) {
		//console.log("found");
		return [object];
	}

	var newArr = [];

	for (i in object.children) {
		var newArr = this.findByID(searchID, object.children[i],arr);
		if (newArr.length > 0) {
			newArr.push(object);
			break;
		}
	}
	//search all children
	//if returns [].length > 0
		//append this		
		//break


	return newArr;
	//return array
}


MiniTimeline.prototype.minMaxValue = function(data) {
	var min = Math.min.apply(null, data);
    var max = Math.max.apply(null, data);
    
	return [min,max];
}


MiniTimeline.prototype._scaleValue = function(range,minmax,value) {
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