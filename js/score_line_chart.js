// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScoreLineChart = {
    draw: function (id, data, options, key) {
        var cfg = {
            w: 350,
            h: 200,
            radius: 5,
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
            margin = {top: 10, right: 20, bottom: 30, left: 45},
            width = +cfg.w - margin.left - margin.right,
            height = +cfg.h - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .range([0, width]);

        var y = d3.scaleLinear()
            .range([height, 0]);

        var line = d3.line()
            .x(function (d) {
                return x(d.week);
            })
            .y(function (d) {
                return y(d[key]);
            });

        var max_w = d3.max(data, function (d) {
            return +d.week
        });
        var nw = max_w - 43;
        // Set domains
        x.domain([42, max_w + 1]);
        y.domain([0, d3.max(data, function (d) {
            return d[key];
        })]);

        var weeks = d3.nest().key(function (d) {
            return d.week;
        }).entries(data).map(function (d) {
            return +d.key;
        });

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(nw + 2).tickFormat(d3.format("d")));

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        g.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) {
                return x(d.week)
            })
            .attr("cy", function (d) {
                return y(d[key])
            })
            .attr("r", cfg.radius)
            .attr("stroke", function (d) {
                return cfg.color(d.id)
            })
            .attr("fill", function (d) {
                return cfg.color(d.id)
            })
            .on("mouseover", function (d) {
                d3.select(this).transition().duration(100)
                    .attr("r", cfg.radius + 2);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                tooltip.html('<b>' + tick_formats[key](d[key]) + '</b> ' + variation(d, key, weeks, data))
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
                    .attr("r", cfg.radius);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

        var pr = g.selectAll(".project")
            .data(cfg.projects)
            .enter().append("g")
            .attr('class', "project")

        pr.append("path")
            .attr('class', 'line_score')
            .attr('d', function (d) {
                data_f = data.filter(function (dd) {
                    return dd.id == d;
                });
                return line(data_f);
            })
            .style("stroke", function (d) {
                return cfg.color(d)
            })

    }
};