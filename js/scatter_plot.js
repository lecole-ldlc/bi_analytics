// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScatterPlot = {
    draw: function (id, data, options, key_x, key_y) {
        var cfg = {
            radius: 5,
            w: 400,
            h: 400,
            projects: [1, 2, 3, 4, 5],
            color: d3.scaleOrdinal(d3.schemeCategory10)
        };

        if ('undefined' !== typeof options) {
            for (var i in options) {
                if ('undefined' !== typeof options[i]) {
                    cfg[i] = options[i];
                }
            }
        }
        $(id).html('');
        var svg = d3.select(id),
            margin = {top: 10, right: 10, bottom: 40, left: 40},
            width = cfg.w - margin.left - margin.right,
            height = cfg.h - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.attr("width", cfg.w)
            .attr("height", cfg.h);


        var x = d3.scaleLinear()
            .rangeRound([0, width]);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(6);

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(6);

        // Set domains
        x.domain([0, d3.max(data, function (d) {
            return d[key_x];
        })]).nice();
        y.domain([0, d3.max(data, function (d) {
            return d[key_y];
        })]).nice();

        // add the gridlines
        g.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .ticks(6)
                .tickSize(-width)
                .tickFormat("")
            );
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .ticks(6)
                .tickSize(-height)
                .tickFormat("")
            );

        // Draw points
        g.append("g")
            .selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", function (d) {
                return x(d[key_x]);
            })
            .attr("cy", function (d) {
                return y(d[key_y]);
            })
            .attr("r", cfg.radius)
            .style("fill", function (d) {
                return cfg.color(d.id);
            })
            .on("mouseover", function (d) {
                d3.select(this).transition().duration(100)
                    .style("opacity", 0.8)
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                tooltip.html(projects_short[d.id - 1] + '['+ d[key_x] + ',' + d[key_y] + ']')
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
            .call(xAxis);

        g.append("g")
            .attr("class", "axis")
            .call(yAxis)

        g.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .attr("class", "axis_label")
            .text(scatter_dims[key_x]);


        // text label for the y axis
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr("class", "axis_label")
            .text(scatter_dims[key_y]);

    }
};