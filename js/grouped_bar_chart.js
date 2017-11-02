// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var GroupedBarChart = {
    draw: function (id, data, options, key) {
        var cfg = {
            w: 300,
            h: 200,
            weeks: [43],
            projects: [1,2,3,4,5],
            color: d3.scaleOrdinal(d3.schemeCategory10)
        };

        if ('undefined' !== typeof options) {
            for (var i in options) {
                if ('undefined' !== typeof options[i]) {
                    cfg[i] = options[i];
                }
            }
        }

        var svg = d3.select(id),
            margin = {top: 5, right: 10, bottom: 20, left: 40},
            width = cfg.w - margin.left - margin.right,
            height = cfg.h - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x0 = d3.scaleBand()
            .rangeRound([0, width])
            .paddingInner(0.1);

        var x1 = d3.scaleBand()
            .padding(0.05);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        var keys = cfg.projects;

        // Set domains
        x0.domain(cfg.weeks);
        x1.domain(keys).rangeRound([0, x0.bandwidth()]);
        y.domain([0, d3.max(data, function (d) {
            return d[key];
        })]).nice();

        // Draw bars
        g.append("g")
            .selectAll("g")
            .data(cfg.weeks)
            .enter().append("g")
            .attr("transform", function (d) {
                return "translate(" + x0(d) + ",0)";
            })
            .selectAll("rect")
            .data(data)
            .enter()
            .filter(function (d) {
                return !isNaN(+d[key]);
            })
            .append("rect")
            .attr("x", function (d) {
                return x1(d.id);
            })
            .attr("y", function (d) {
                return y(d[key]);
            })
            .attr("width", x1.bandwidth())
            .attr("height", function (d) {
                return height - y(d[key]);
            })
            .attr("fill", function (d) {
                return color(d.id);
            })
            .on("mouseover", function (d) {
                d3.select(this).transition().duration(100)
                    .style("opacity", 0.8)
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                tooltip.html(projects_short[d.id - 1] + ' <b>' + tick_formats[key](d[key]) + '</b> ' + variation(d, key, cfg.weeks, data))
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px");

            })
            .on("mousemove", function (d) {
                tooltip
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px");

            })
            .on("mouseout", function (d) {
                d3.select(this).transition().duration(100)
                    .style("opacity", 1)
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(d3.axisBottom(x0));

        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).tickFormat(tick_formats[key]))


    }
};