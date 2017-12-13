// Author: Antoine Scherrer <antoine.scherrer@lecole-ldlc.com>

var ScoreRankChart = {
    draw: function (id, data, options, key) {
        var cfg = {
            w: 500,
            h: 300,
            strokeWidth: 10,
            radius: 3,
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
        var margin = {top: 50, right: 200, bottom: 100, left: 125};

        var width = cfg.W - margin.left - margin.right,
            height = cfg.h - margin.top - margin.bottom;

        var svg = d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var colour = d3.scaleOrdinal(cfg.color);

        // Use indexOf to fade in one by one
        var highlight = data.map(function (d) {
            return d.key;
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
//     	.curve(d3.curveMonotoneX);


        var parsedData = [];
        data.forEach((d) => {
            var dObj = {project: d.project, ranks: []};
            for (var week in d) {
                if (week != "project") {
                    if (d[week] != 0) {
                        dObj.ranks.push({week: +week, rank: +d[week], project: dObj});
                    }
                }
            }
            parsedData.push(dObj);
        });


        var xTickNo = parsedData[0].ranks.length;
        x.domain(d3.extent(parsedData[0].ranks, d => d.week));

        colour.domain(data.map(d => d.project));

        // Ranks
        var ranks = 16;
        y.domain([0.5, ranks]);

        var axisMargin = 20;

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
            .call(yAxis);
        yAxisElem.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90) translate(" + [-height / 2, -margin.left / 3] + ")")
            .text("Intra-University Ranking");

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
            .style("stroke", d => colour(d.project))
            .style("stroke-width", cfg.strokeWidth)
            .style("opacity", 0.1)
            .transition()
            .duration(500)
            .delay(d => (highlight.indexOf(d.project) + 1) * 500)
            .style("opacity", d => highlight.includes(d.project) ? 1 : 0.1);

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
            .text(d => d.project)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(d => (highlight.indexOf(d.project) + 1) * 500)
            .style("opacity", 1);

        var endDots = svg.append("g")
            .selectAll("circle")
            .data(parsedData.filter(d => highlight.includes(d.project)))
            .enter().append("circle")
            .attr("class", "end-circle")
            .attr("cx", d => x(d.ranks[d.ranks.length - 1].week))
            .attr("cy", d => y(d.ranks[d.ranks.length - 1].rank))
            .attr("r", cfg.strokeWidth)
            .style("fill", d => colour(d.project))
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(d => (highlight.indexOf(d.project) + 1) * 500)
            .style("opacity", 1);

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
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        svg.selectAll(".rank-line")
            .each(d => highlight.includes(d.project) ? d.line.parentNode.appendChild(d.line) : 0);

        svg.select("g.end-labels").raise();

        function mouseover(d) {
            // Hide labels and dots from initial animation
            svg.selectAll(".end-label").style("opacity", 0);
            svg.selectAll(".end-circle").style("opacity", 0);

            svg.selectAll(".rank-line").style("opacity", 0.1);
            d3.select(d.data.project.line).style("opacity", 1);
            d.data.project.line.parentNode.appendChild(d.data.project.line);
            tooltip.attr("transform", "translate(" + x(d.data.week) + "," + y(d.data.rank) + ")")
                .style("fill", colour(d.data.project.project))
            tooltip.select("text").text(d.data.project.project)
                .attr("text-anchor", d.data.week == x.domain()[0] ? "start" : "middle")
                .attr("dx", d.data.week == x.domain()[0] ? -10 : 0)
        }

        function mouseout(d) {
            svg.selectAll(".rank-line").style("opacity", d => highlight.includes(d.project) ? 1 : 0.1);

            svg.selectAll(".end-label").style("opacity", 1);
            svg.selectAll(".end-circle").style("opacity", 1);
            tooltip.attr("transform", "translate(-100,-100)");
        }


    }
};