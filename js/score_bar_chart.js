// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScoreBarChart = {
    draw: function (id, data, options, key) {
        var cfg = {
            w: 350,
            h: 200,
            opacity: 1,
            opacity_prev: 0.7,
            week: 43,
            weeks: [43],
            projects: [1, 2, 3, 4, 5],
            color: d3.scaleOrdinal(d3.schemeCategory10),
            color_text: d3.scaleOrdinal(d3.schemeCategory10)
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
            margin = {top: 20, right: 20, bottom: 30, left: 30},
            width = +cfg.w - margin.left - margin.right,
            height = +cfg.h - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear()
            .range([0, width]);

        var y = d3.scaleBand()
            .range([height, 0]);

        data_f = data.filter(function (d) {
            return !isNaN(d[key]) && d.week == cfg.week;
        });
        data_f.sort(function (x, y) {
            return x[key] - y[key];
        });

        // Fill up a new array with previous week scores
        data_fp = [];
        data_f.forEach(function (d) {
            data.forEach(function (d2) {
                if (d2.id == d.id && d2.week == (d.week - 1)) {
                    data_fp.push(d2);
                }
            });
        });

        // Set domains
        x.domain([0, 100]);
        y.domain(data_f.map(function (d) {
            return d.id;
        }))
            .padding(0.1);

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(6).tickFormat(function (d) {
                return parseInt(d);
            }).tickSizeInner([-height]));


        g.selectAll(".bar_p")
            .data(data_fp)
            .enter().append("rect")
            .attr("class", "bar_p")
            .attr("x", 0)
            .attr("height", y.bandwidth() / 3)
            .style("opacity", .6)
            .attr("y", function (d) {
                return y(d.id) + y.bandwidth() / 3 * 2;
            })
            .attr("width", function (d) {
                return x(d[key]);
            })
            .attr("fill", function (d) {
                return cfg.color(d.id);
            });

        var bars = g.selectAll(".bar")
            .data(data_f)
            .enter().append("g")
            .attr("class", 'bar_group');

        bars.append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .style("opacity", cfg.opacity)
            .attr("height", y.bandwidth() / 3 * 2)
            .attr("y", function (d) {
                return y(d.id);
            })
            .attr("width", function (d) {
                return x(d[key]);
            })
            .attr("fill", function (d) {
                return cfg.color(d.id);
            })
            .on("mouseover", function (d) {
                d3.select(this).transition().duration(100)
                    .style("opacity", cfg.opacity - 0.1);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                tooltip.html('<b>' + tick_formats[key](d[key]) + '</b> ' + variation(d, key, cfg.weeks, data))
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
                    .style("opacity", cfg.opacity);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        bars.append('text')
            .attr('class', 'score_label')
            .attr('x', 5)
            .attr('y', function (d) {
                return y(d.id) + 5;
            })
            .attr('fill', function (d) {
                return cfg.color_text(d.id);
            })
            .attr('dy', '8')
            .text(function (d, i) {
                return (5 - i).toString() + ' : ' + projects[+d.id - 1];
            });


    }
};