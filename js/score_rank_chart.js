// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScoreRankChart = {
        draw: function (id, data_full, options, key) {
            var cfg = {
                w: 350,
                h: 250,
                strokeWidth: 8,
                radius: 2,
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


            nested_data = d3.nest()
                .key(function (d) {
                    return d.week
                })
                .rollup(function (leaves) {
                    leaves.sort(function (a, b) {
                        return d3.descending(a[key], b[key]);
                    });
                    var dat = []
                    leaves.forEach(function (d, i) {
                        dat.push({id: d.id, rank: i + 1})
                    });
                    return dat;
                })
                .entries(data_full);

            var data = [];
            cfg.projects.forEach(function (p) {
                dat = {project: projects[p - 1]};
                weeks.forEach(function (w) {
                    dat[w] = 0;
                    var e = nested_data.find(function (a) {
                        return a.key == w;
                    });
                    if (e) {
                        var r = e.value.find(function (a) {
                            return a.id == p;
                        });
                        if (r) {
                            dat[w] = r.rank;
                        }
                    }
                });
                data.push(dat);
            });

            var margin = {top: 10, right: 10, bottom: 30, left: 30};
            var width = +cfg.w - margin.left - margin.right,
                height = +cfg.h - margin.top - margin.bottom;

            var main_svg = d3.select(id)
                    .attr("width", width)
                    .attr("height", height),

                svg = main_svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            var highlight = data.map(function (d) {
                return d.project;
            });

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", width)
                .attr("height", height + cfg.strokeWidth);

            var x = d3.scaleLinear()
                .range([0, width]);

            var y = d3.scaleLinear()
                .range([0, height]);

            var voronoi = d3.voronoi()
                .x(d => x(d.week))
                .y(d => y(d.rank))
                .extent([[-margin.left / 2, -margin.top / 2], [width + margin.right / 2, height + margin.bottom / 2]]);

            var line = d3.line()
                .x(d => x(d.week))
                .y(d => y(d.rank))
                // Uncomment this to use monotone curve
                .curve(d3.curveMonotoneX);


            var parsedData = [];
            data.forEach((d) => {
                var dObj = {project: d.project, ranks: []};
                for (var prop in d) {
                    if (prop != "project") {
                        if (d[prop] != 0) {
                            dObj.ranks.push({week: +prop, rank: +d[prop], project: dObj});
                        }
                    }
                }
                parsedData.push(dObj);
            });

            var xTickNo = parsedData[0].ranks.length;
            x.domain(d3.extent(parsedData[0].ranks, d => d.week));

            cfg.color.domain(data.map(d => d.project));

// Ranks
            var ranks = 5;
            y.domain([0.5, ranks]);

            var axisMargin = 10;

            var xAxis = d3.axisBottom(x)
                .tickFormat(d3.format("d"))
                .ticks(xTickNo)
                .tickSize(0);

            var yAxis = d3.axisLeft(y)
                .ticks(ranks)
                .tickSize(0);

            var xGroup = svg.append("g");
            var xAxisElem = xGroup.append("g")
                .attr("transform", "translate(" + [0, height + axisMargin * 1.2] + ")")
                .attr("class", "x-axis")
                .call(xAxis);

            xGroup.append("g").selectAll("line")
                .data(x.ticks(xTickNo))
                .enter().append("line")
                .attr("class", "grid-line")
                .attr("y1", 0)
                .attr("y2", height + 10)
                .attr("x1", d => x(d))
                .attr("x2", d => x(d));

            var yGroup = svg.append("g");
            var yAxisElem = yGroup.append("g")
                .attr("transform", "translate(" + [-axisMargin, 0] + ")")
                .attr("class", "y-axis")
                .call(yAxis.ticks(4));

            svg.selectAll(".tick")
                .each(function (d, i) {
                    if (d == 0) {
                        this.remove();
                    }
                });
            yGroup.append("g").selectAll("line")
                .data(y.ticks(ranks))
                .enter().append("line")
                .attr("class", "grid-line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", d => y(d))
                .attr("y2", d => y(d));

            var lines = svg.append("g")
                .selectAll("path")
                .data(parsedData)
                .enter().append("path")
                .attr("class", "rank-line")
                .attr("d", function (d) {
                    d.line = this;
                    return line(d.ranks)
                })
                .attr("clip-path", "url(#clip)")
                .style("stroke", d => cfg.color(d.project))
                .style("stroke-width", cfg.strokeWidth);


            var endLabels = svg.append("g")
                .attr("class", "end-labels")
                .selectAll("text")
                .data(parsedData.filter(d => highlight.includes(d.project)))
                .enter().append("text")
                .attr("class", "end-label")
                .attr("x", d => x(d.ranks[d.ranks.length - 1].week))
                .attr("y", d => y(d.ranks[d.ranks.length - 1].rank))
                .attr("dx", 20)
                .attr("dy", cfg.strokeWidth / 2)
            //.text(d => d.project);


            var endDots = svg.append("g")
                .selectAll("circle")
                .data(parsedData.filter(d => highlight.includes(d.project)))
                .enter().append("circle")
                .attr("class", "end-circle")
                .attr("cx", d => x(d.ranks[d.ranks.length - 1].week))
                .attr("cy", d => y(d.ranks[d.ranks.length - 1].rank))
                .attr("r", cfg.strokeWidth)
                .style("fill", d => cfg.color(d.project));


            var tooltip = svg.append("g")
                .attr("transform", "translate(-100, -100)")
                .attr("class", "tooltip");
            tooltip.append("circle")
                .attr("r", cfg.strokeWidth);
            tooltip.append("text")
                .attr("class", "name")
                .attr("y", -20);

            var voronoiGroup = svg.append("g")
                .attr("class", "voronoi");

            voronoiGroup.selectAll("path")
                .data(voronoi.polygons(d3.merge(parsedData.map(d => d.ranks))))
                .enter().append("path")
                .attr("d", function (d) {
                    return d ? "M" + d.join("L") + "Z" : null;
                })
            //.on("mouseover", mouseover)
            //.on("mouseout", mouseout);

            svg.selectAll(".rank-line")
                .each(d => highlight.includes(d.project) ? d.line.parentNode.appendChild(d.line) : 0);


        }
    }
;