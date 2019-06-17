$(document).ready(function() {
  $('.brands-logo').owlCarousel({
	loop:true,
	margin:1,
	nav:true,
	autoplay:true,
	autoplayTimeout:1000,
	responsive: {
	  0: {
		items: 1,
		nav: true
	  },
	  600: {
		items: 3,
		nav: false
	  },
	  1000: {
		items: 5,
		nav: true,
		loop: false,
		margin: 20
	  }
	}
  })
})

$(document).ready(function(){
$( ".menu-btn" ).click(function() {
  $( ".main-panel" ).toggleClass("full-box");
});
});
$(document).ready(function(){
$( ".sidebar" ).hover(function() {
  $( ".main-panel" ).toggleClass("hover-box");
});
});


/**graph**/
window.onload = function () {

var chart = new CanvasJS.Chart("chartContainer", {
	
	axisY: {
		title: "Progress Chart"
	},
	data: [{
		type: "column",	
		yValueFormatString: "#,### °C",
		indexLabel: "{y}",
		dataPoints: [
			{ label: "Product 1", y: 206 },
			{ label: "Product 2", y: 163 },
			{ label: "Product 3", y: 154 },
			{ label: "Product 4", y: 176 },
			{ label: "Product 5", y: 184 },
			{ label: "Product 6", y: 122 }
		]
	}]
});

function updateChart() {
	var boilerColor, deltaY, yVal;
	var dps = chart.options.data[0].dataPoints;
	for (var i = 0; i < dps.length; i++) {
		deltaY = Math.round(2 + Math.random() *(-2-2));
		yVal = deltaY + dps[i].y > 0 ? dps[i].y + deltaY : 0;
		boilerColor = yVal > 200 ? "#FF2500" : yVal >= 170 ? "#FF6000" : yVal < 170 ? "#6B8E23 " : null;
		dps[i] = {label: "Boiler "+(i+1) , y: yVal, color: boilerColor};
	}
	chart.options.data[0].dataPoints = dps; 
	chart.render();
};
updateChart();

setInterval(function() {updateChart()}, 500);

}
/** graph-end**/