// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScoreStackedBarChart = {
    compute_total: function (parts, coefs, d, stacked_scales) {
        total = 0;
        for (var i in parts) {
            key = parts[i];
            if (coefs[key] > 0) {
                total += coefs[key] * stacked_scales[key](d[key]);
            } else {
                total += -coefs[key] * (1 - stacked_scales[key](d[key]));
            }
        }
        return total;
    },
    draw: function (id, data, options, parts, coefs) {
        var cfg = {
            w: 350,
            h: 250,
            opacity: 1,
            opacity_prev: 0.7,
            week: 43,
            weeks: [43],
            projects: [1, 2, 3, 4, 5],
            color: d3.scaleOrdinal(d3.schemeCategory10),
            color_text: d3.scaleOrdinal(["#eee"]),
            metric_labels: {
                'blog_pv': 'Pages vues',
                'blog_vu': 'Visiteurs',
                'blog_tr': 'Taux de rebond',
                'rs_community': 'Communauté',
                'rs_engagement': 'Engagement',
                'rs_budget': 'Budget',
                'rs_publications': 'Publications',
                'blog_score': 'Blog',
                'rs_score': 'Réseaux sociaux',
            }
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

        var stacked_scales = {};
        var self = this;
        data_f = data.filter(function (d) {
            return d.week == cfg.week;
        });
        data_f.forEach(function (d) {
            for (var i in parts) {
                if (isNaN(d[parts[i]])) {
                    d[parts[i]] = 0;
                }
            }
        });

        data = data.filter(function (d) {
            if (d.week == cfg.week || d.week == (cfg.week - 1)) {
                return true;
            }
            return false;
        });

        for (var i in parts) {
            stacked_scales[parts[i]] = d3.scaleLinear()
                .domain([0, d3.max(data, function (d) {
                    return d[parts[i]];
                })])
                .range([0, 1]);
        }
        data_f.forEach(function (d) {
            d.total = self.compute_total(parts, coefs, d, stacked_scales);
        });
        data_f.sort(function (x, y) {
            return x.total > y.total;
        });

        // Fill up a new array with previous week scores
        data_fp = [];
        data_f.forEach(function (d) {
            data.forEach(function (d2) {
                if (d2.id == d.id && d2.week == (d.week - 1)) {
                    d2.total = self.compute_total(parts, coefs, d2, stacked_scales);
                    data_fp.push(d2);
                }
            });
        });

        data_stack = d3.stack()
            .keys(parts)
            .value(function (d, key) {
                return coefs[key] > 0 ? stacked_scales[key](d[key]) * coefs[key] : -coefs[key] * (1 - stacked_scales[key](d[key]));
            })
            (data_f);

        data_stack_p = d3.stack()
            .keys(parts)
            .value(function (d, key) {
                return coefs[key] > 0 ? stacked_scales[key](d[key]) * coefs[key] : -coefs[key] * (1 - stacked_scales[key](d[key]));
            })
            (data_fp);

        // Set domains
        max_data = d3.max(data_f, function (d) {
            return d.total
        });
        max_data_p = d3.max(data_fp, function (d) {
            return d.total
        });
        x.domain([0, d3.max([max_data, max_data_p])]).nice();
        y.domain(data_f.map(function (d) {
            return d.id;
        }))
            .padding(0.15);

        g.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .ticks(10)
                .tickSize(-height)
                .tickFormat("")
            );
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .ticks(0)
                .tickSize(-width)
                .tickFormat("")
            );

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10).tickFormat(function (d) {
                return '';
            }));

        g.append("g")
            .selectAll("g")
            .data(data_stack_p)
            .enter()
            .append("g")
            .attr("fill", function (d) {
                return cfg.color(d.key);
            })
            .selectAll("rect")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("rect")
            .attr("class", "bar_p")
            .attr("x", function (d) {
                return x(d[0]);
            })
            .attr("height", y.bandwidth() / 3)
            .style("opacity", .6)
            .attr("y", function (d) {
                return y(d.data.id) + y.bandwidth() / 3 * 2;
            })
            .attr("width", function (d) {
                return x(d[1]) - x(d[0]);
            }).on("mouseover", function (d) {
            var k = d3.select(this.parentNode).datum().key;
            d3.select(this).transition().duration(100)
                .style("opacity", cfg.opacity - 0.1);
            tooltip.transition()
                .duration(200)
                .style("opacity", .8);
            tooltip.html(cfg.metric_labels[k]
                + ' <b>' +
                tick_formats[k](d.data[k])
                + '</b>')
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


        var bars = g.append("g")
            .selectAll("g")
            .data(data_stack)
            .enter().append("g")
            .attr("fill", function (d) {
                return cfg.color(d.key);
            })
            .attr("class", 'bar_group');

        bars.selectAll("rect")
            .data(function (d) {
                return d;
            })
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function (d) {
                return x(d[0]);
            })
            .style("opacity", cfg.opacity)
            .attr("height", y.bandwidth() / 3 * 2)
            .attr("y", function (d) {
                return y(d.data.id);
            })
            .attr("width", function (d) {
                return x(d[1]) - x(d[0]);
            })
            .on("mouseover", function (d) {
                var k = d3.select(this.parentNode).datum().key;
                d3.select(this).transition().duration(100)
                    .style("opacity", cfg.opacity - 0.1);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .8);
                tooltip.html(cfg.metric_labels[k]
                    + ' <b>' +
                    tick_formats[k](d.data[k])
                    + '</b>')
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

        g.append("g").selectAll("text")
            .data(data_f)
            .enter()
            .append("text")
            .attr('class', 'score_label')
            .attr("pointer-events", "none")
            .attr('x', 5)
            .attr('y', function (d) {
                return y(+d.id) + 5;
            })
            .attr('fill', function (d) {
                return cfg.color_text(d.id);
            })
            .attr('dy', '8')
            .text(function (d, i) {
                return (5 - i).toString() + ' : ' + projects[+d.id - 1];
            })

    }
};