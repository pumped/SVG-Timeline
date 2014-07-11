var jsonCircles = [
{
  "x_axis": 30,
  "y_axis": 30,
  "radius": 20,
  "color" : "green"
 }, {
  "x_axis": 70,
  "y_axis": 70,
  "radius": 20,
  "color" : "purple"
 }, {
  "x_axis": 110,
  "y_axis": 100,
  "radius": 20,
  "color" : "red"
}];

var timelines = [{
	startTime:'0',
	endTime:'30',
	ID:'1',
	children:[{
			startTime:'5',
			endTime:'35',
			ID:'1.1',
			children:[{
				startTime:'5',
				endTime:'35',
				ID:'1.1.1',
				children:[]
			}]
		},{
			startTime:'1',
			endTime:'32',
			ID:'1.2',
			children:[]
		},{
			startTime:'0',
			endTime:'30',
			ID:'1.3',
			children:[{
				startTime:'20',
				endTime:'25',
				ID:'1.3.1',
				children:[]
			},{
				startTime:'4',
				endTime:'28',
				ID:'1.3.2',
				children:[{
					startTime:'8',
					endTime:'28',
					ID:'1.3.2.1',
					children:[{
						startTime:'12',
						endTime:'28',
						ID:'1.3.2.1.1',
						children:[]
					}]
				}]
			}]
		}]
}];




function Timeline (data) {
	this.data = data;

	this.c = {
		currentRow:0
	};

	this.config = {
		startDate: 2014,
		elementHeight: 50,
		elementWidth: 50,
		lineWidth: 1,
		rowSpacing: 10,
		stepWidth:40,
		pointSize:8,
		topBorder: 30,

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
}

function encode_as_img_and_link(){
	 var svg = $("#timeline").html();
	 var b64 = Base64.encode(svg); // or use btoa if supported

	 // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
	 $("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>"));
}

Timeline.prototype.drawTimeline = function(element) {
	/*var width = this._latestTime();
	console.log("Width: " + width);*/
	this.steps = 35;
	this.height = 800;
	this.draw = SVG(element).size(1500,this.height);


	this.chart = this.draw.group();
	this.chart.attr('id','chart');
	this.plotGroup = this.chart.group();
	this.plotGroup.attr('id','plot');
	
	this.drawBase();
	this.processTimeline(this.data);
};

Timeline.prototype._latestTime = function(data) {
	var latest = 0;
	for (i in this.data) {
		if (this.data[i].children.length) {
			latest = this._latestTime(this.data[i].children);
		}
		if (this.data[i].endTime > latest) {
			return this.data[i].endTime;
		}
	}
};

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
		var x = xSkip + (i*this.config.stepWidth);
		
		//draw columns
		var column = underlay.rect(this.config.stepWidth,y2-y)
			column.move(x - (0.5*this.config.stepWidth),y);
			column.fill('#fff');
			column.attr('class','rowHover');

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

Timeline.prototype.processTimeline  = function(tData,parent) {
	//sort

	//draw
	for (i in tData) {
		var t = tData[i];

		if (parent) {
			var group = parent.group.group();
		} else {
			var group = this.plotGroup.group();
		}
		t.group = group;
		group.attr('id','group'+t.ID);
		
		//workout element coordinates
		this.c.currentRow++;
		console.log('Drawing ' + t.ID + ' at ' + this.c.currentRow);
		var x = (t.startTime * this.config.stepWidth);
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

		//draw points on timeline last to be above everything else
		for(i=0;i <= (t.endTime - t.startTime); i++) {
			var circle = group.circle(this.config.pointSize);
			circle.move(x+(0.5*this.config.elementWidth)+(i*this.config.stepWidth)-(0.5*this.config.pointSize),tY-(0.5*this.config.pointSize));
			circle.fill('#fff');
			circle.stroke({color: '#000', width: this.config.lineWidth});

			if ((i+parseInt(t.startTime))%this.config.grid.majorLineInterval != 0) {
				circle.attr('class','minorPoint');
			} else {
				circle.attr('class','majorPoint');
			}
		}

		//draw element last to be on top
		var rect = group.rect(this.config.elementHeight, this.config.elementWidth).move(x,y);
	}
};


var t = new Timeline(timelines);
t.drawTimeline("timeline");
encode_as_img_and_link();

