function drawChart(query) {

  d3.csv(query).then(function(prices) {

    // reverse the prices if needed.
    prices.reverse();
    
    const months = {0 : 'Jan', 1 : 'Feb', 2 : 'Mar', 3 : 'Apr', 4 : 'May', 5 : 'Jun', 6 : 'Jul', 7 : 'Aug', 8 : 'Sep', 9 : 'Oct', 10 : 'Nov', 11 : 'Dec'}

    var dateFormat = d3.timeParse("%Y-%m-%d");
    for (var i = 0; i < prices.length; i++) {
      
      var date_repr = dateFormat(prices[i]['timestamp']);
      if (date_repr == undefined) {
        console.log(prices[i]['timestamp']);
      }
      prices[i]['timestamp']  = date_repr;
      prices[i]['low'] = parseFloat(prices[i]['low']);
      prices[i]['high'] = parseFloat(prices[i]['high']);
      prices[i]['close'] = parseFloat(prices[i]['close']);
    }

    const margin = {top: 15, right: 65, bottom: 205, left: 50},
    w = 1000 - margin.left - margin.right,
    h = 625 - margin.top - margin.bottom;

    d3.select('#container').html('');

    var svg = d3.select("#container")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" +margin.left+ "," +margin.top+ ")");

    let dates = _.map(prices, 'timestamp');
    
    var xmin = d3.min(prices.map(r => r.timestamp.getTime()));
    var xmax = d3.max(prices.map(r => r.timestamp.getTime()));
    var xScale = d3.scaleLinear().domain([-1, dates.length-1])
            .range([0, w])
    var xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
    let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3)
    var xAxis = d3.axisBottom()
                  .scale(xScale)
                  .tickFormat(function(d) {
                    d = dates[d]
                    hours = d.getHours()
                    minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
                    amPM = hours < 13 ? 'am' : 'pm'
                    return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
                  });
    
    svg.append("rect")
          .attr("id","rect")
          .attr("width", w)
          .attr("height", h)
          .style("fill", "none")
          .style("pointer-events", "all")
          .attr("clip-path", "url(#clip)")
    
    var gX = svg.append("g")
          .attr("class", "axis x-axis") //Assign "axis" class
          .attr("transform", "translate(0," + h + ")")
          .call(xAxis)
    
    gX.selectAll(".tick text")
      .call(wrap, xBand.bandwidth())

    var ymin = d3.min(prices.map(r => r.low));
    var ymax = d3.max(prices.map(r => r.high));
    console.log("ymin = " + ymin);
    console.log("ymax = " + ymax);
    var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
    var yAxis = d3.axisLeft()
            .scale(yScale)
    
    var gY = svg.append("g")
          .attr("class", "axis y-axis")
          .call(yAxis);
    
    var chartBody = svg.append("g")
          .attr("class", "chartBody")
          .attr("clip-path", "url(#clip)");
    
    // draw rectangles
    let candles = chartBody.selectAll(".candle")
       .data(prices)
       .enter()
       .append("rect")
       .attr('x', (d, i) => xScale(i) - xBand.bandwidth())
       .attr("class", "candle")
       .attr('y', d => yScale(Math.max(d.open, d.close)))
       .attr('width', xBand.bandwidth())
       .attr('height', d => (d.open === d.close) ? 1 : yScale(Math.min(d.open, d.close))-yScale(Math.max(d.open, d.close)))
       .attr("fill", d => (d.open === d.close) ? "silver" : (d.open > d.close) ? "red" : "green")
    
    // draw high and low
    let stems = chartBody.selectAll("g.line")
       .data(prices)
       .enter()
       .append("line")
       .attr("class", "stem")
       .attr("x1", (d, i) => xScale(i) - xBand.bandwidth()/2)
       .attr("x2", (d, i) => xScale(i) - xBand.bandwidth()/2)
       .attr("y1", d => yScale(d.high))
       .attr("y2", d => yScale(d.low))
       .attr("stroke", d => (d.open === d.close) ? "white" : (d.open > d.close) ? "red" : "green");
    
    svg.append("defs")
       .append("clipPath")
       .attr("id", "clip")
       .append("rect")
       .attr("width", w)
       .attr("height", h)
    
    const extent = [[0, 0], [w, h]];
    
    var resizeTimer;
    var zoom = d3.zoom()
      .scaleExtent([1, 100])
      .translateExtent(extent)
      .extent(extent)
      .on("zoom", zoomed)
      .on('zoom.end', zoomend);
    
    svg.call(zoom)

    function zoomed() {
      
      var t = d3.event.transform;
      let xScaleZ = t.rescaleX(xScale);
      
      let hideTicksWithoutLabel = function() {
        d3.selectAll('.xAxis .tick text').each(function(d){
          if(this.innerHTML === '') {
          this.parentNode.style.display = 'none'
          }
        })
      }

      gX.call(
        d3.axisBottom(xScaleZ).tickFormat((d, e, target) => {
            if (d >= 0 && d <= dates.length-1) {
          d = dates[d]
          hours = d.getHours()
          minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
          amPM = hours < 13 ? 'am' : 'pm'
          return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
          }
        })
      )

      candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth()*t.k)/2)
           .attr("width", xBand.bandwidth()*t.k);
      stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);
      stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);

      hideTicksWithoutLabel();

      gX.selectAll(".tick text")
      .call(wrap, xBand.bandwidth())

    }

    function zoomend() {
      var t = d3.event.transform;
      let xScaleZ = t.rescaleX(xScale);
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(function() {

      var xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])))
        xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])))
        filtered = _.filter(prices, d => ((d.timestamp >= xmin) && (d.timestamp <= xmax)))
        minP = +d3.min(filtered, d => d.low)
        maxP = +d3.max(filtered, d => d.high)
        buffer = Math.floor((maxP - minP) * 0.1)

      yScale.domain([minP - buffer, maxP + buffer])
      candles.transition()
           .duration(800)
           .attr("y", (d) => yScale(Math.max(d.open, d.close)))
           .attr("height",  d => (d.open === d.close) ? 1 : yScale(Math.min(d.open, d.close))-yScale(Math.max(d.open, d.close)));
           
      stems.transition().duration(800)
         .attr("y1", (d) => yScale(d.high))
         .attr("y2", (d) => yScale(d.low))
      
      gY.transition().duration(800).call(d3.axisLeft().scale(yScale));

      }, 500)
      
    }
    
    enableCmd();
  }, 
  
  function(error) {
    alert('That stock was not found!');
    console.log(error);
    d3.select('#container').html('');
    enableCmd();
  });

}

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
    line.push(word);
    tspan.text(line.join(" "));
    if (tspan.node().getComputedTextLength() > width) {
      line.pop();
      tspan.text(line.join(" "));
      line = [word];
      tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
    }
    }
  });
}

function checkAndTrigger(e) {
  if (event.key === 'Enter') {
    displaySymbol();
  }
}

function disableCmd() {
  document.getElementById('symbol_name').disabled = true;
  document.getElementById('display_cmd').disabled = true;
  document.getElementById('display_cmd').value = 'Please wait ...';
}

function enableCmd() {
  document.getElementById('symbol_name').disabled = false;
  document.getElementById('display_cmd').disabled = false;
  document.getElementById('display_cmd').value = 'Display';
}

function displaySymbol() {
  disableCmd();
  symbol = d3.select('#symbol_name').property('value');
  drawChart("symbol/" + symbol);
}

