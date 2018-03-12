/*  

This code is based on following convention:

https://github.com/bumbeishvili/d3-coding-conventions/blob/84b538fa99e43647d0d4717247d7b650cb9049eb/README.md

*/

function renderChart(params) {

  // Exposed variables
  var attrs = {
    id: "ID" + Math.floor(Math.random() * 1000000),  // Id for event handlings
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 5,
    marginBottom: 5,
    marginRight: 5,
    marginLeft: 5,
    container: 'body',
    defaultTextFill: '#2C3E50',
    defaultFont: 'Helvetica',
    data: null
  };

  //InnerFunctions which will update visuals
  var updateData;

  //Main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //Calculated properties
      var calc = {}
      calc.id = "ID" + Math.floor(Math.random() * 1000000);  // id for event handlings
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      //#########################  SCALES  ########################
      var scales = {};

      //x axis scale
      scales.x = d3.scaleLinear()
        .range([0, calc.chartWidth])
        .domain([minYear(), maxYear()]);

      //y axis scale  
      scales.y = d3.scaleLinear()
        .range([calc.chartHeight, 0])
        .domain([0, dataMaxValue()]);

      //###########################  AXES  ########################
      var axes = {};

      //y axis to show percents
      axes.y = d3.axisLeft(scales.y);

      //x axis for years  
      axes.x = d3.axisBottom(scales.x);

      //Drawing containers
      var container = d3.select(this);

      //Add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .attr('font-family', attrs.defaultFont);

      //Add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      //container for y axis
      var yAxisContainer = chart.patternify({ tag: 'g', selector: 'y-axis-container' });

      //display y axis
      yAxisContainer.call(axes.y);

      //container for y axis
      var xAxisContainer = chart.patternify({ tag: 'g', selector: 'x-axis-container' })
        .attr('transform', 'translate(0,' + axisYPosition() + ')');

      //display y axis
      xAxisContainer.call(axes.x);

      //################### FUNCTIONS ####################

      function minYear() {
        return new Date(attrs.data.data[0]['0']);
      }

      function maxYear() {
        var length = attrs.data.data.length;
        return new Date(attrs.data.data[length - 1]['0']);
      }

      function dataMaxValue() {
        var maxValue = attrs.data.data[0]['1'];
        attrs.data.data.forEach(element => {
          if (element['1'] > maxValue)
            maxValue = element['1'];
        });
        return maxValue;
      }

      function axisYPosition(){
        var firstElemTransform = d3.select(".y-axis-container g:nth-child(2)").attr('transform');
        var yValue = firstElemTransform.substring(firstElemTransform.indexOf("(") + 1, firstElemTransform.indexOf(")")).split(",")[1];
        return yValue;
      }

      // Smoothly handle data updating
      updateData = function () {

      }
      //#########################################  UTIL FUNCS ##################################

      function handleWindowResize() {
        d3.select(window).on('resize.' + attrs.id, function () {
          setDimensions();
        });
      }

      function setDimensions() {
        setSvgWidthAndHeight();
        container.call(main);
      }

      function setSvgWidthAndHeight() {
        var containerRect = container.node().getBoundingClientRect();
        if (containerRect.width > 0)
          attrs.svgWidth = containerRect.width;
        if (containerRect.height > 0)
          attrs.svgHeight = containerRect.height;
      }

      function debug() {
        if (attrs.isDebug) {
          //Stringify func
          var stringified = scope + "";

          // Parse variable names
          var groupVariables = stringified
            //Match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //Match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //Get xxx
            .map(v => v[0].trim())

          //Assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }
      debug();
    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll('.' + selector).data(data, (d, i) => {
      if (typeof d === "object") {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    })
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //Dynamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //Set attrs as property
  main.attrs = attrs;

  //Debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //Exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // Run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
