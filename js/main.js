const state = {
    scene: 0,
    selectedCountry: "",
    displayYear: 2023
};

const scenes = [
    {
        title: "Wealth and longevity usually rise together",
        description:
            "Countries with higher GDP per person generally have longer life expectancy."
    },
    {
        title: "Income is not the whole story",
        description:
            "Some countries achieve relatively long lives without reaching the world's highest income levels."
    },
    {
        title: "Every country follows its own path",
        description:
            "Choose a country or hover over a point to explore how development changed from 2000 to 2023."
    }
];

const svg = d3.select("#chart");
const tooltip = d3.select("#tooltip");
const previousButton = d3.select("#previous-button");
const nextButton = d3.select("#next-button");
const countrySelect = d3.select("#country-select");
const explorationControls = d3.select("#exploration-controls");

const svgWidth = 960;
const svgHeight = 600;

const margin = {
    top: 50,
    right: 60,
    bottom: 75,
    left: 90
};

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let xScale;
let yScale;
let populationScale;

const regionColors = d3.scaleOrdinal()
    .domain([
        "East Asia & Pacific",
        "Europe & Central Asia",
        "Latin America & Caribbean",
        "Middle East & North Africa",
        "North America",
        "South Asia",
        "Sub-Saharan Africa"
    ])
    .range(d3.schemeTableau10);

async function init() {
    const data = await d3.csv("data/development.csv", d => ({
        Country: d.Country,
        CountryCode: d.CountryCode,
        Region: d.Region,
        IncomeGroup: d.IncomeGroup,
        Year: +d.Year,
        GDPPerCapita: +d.GDPPerCapita,
        LifeExpectancy: +d.LifeExpectancy,
        Population: +d.Population
    }));

    const countries = Array.from(new Set(data.map(d => d.Country))).sort();

    countrySelect
        .selectAll("option.country-option")
        .data(countries)
        .enter()
        .append("option")
        .attr("class", "country-option")
        .attr("value", d => d)
        .text(d => d);

    countrySelect.on("change", function () {
        state.selectedCountry = this.value;
        renderScene(data);
    });

    previousButton.on("click", function () {
        if (state.scene > 0) {
            state.scene -= 1;
            renderScene(data);
        }
    });

    nextButton.on("click", function () {
        if (state.scene < scenes.length - 1) {
            state.scene += 1;
            renderScene(data);
        }
    });

    renderScene(data);
}

function renderScene(data) {
    const scene = scenes[state.scene];

    d3.select("#scene-title").text(scene.title);
    d3.select("#scene-description").text(scene.description);
    d3.select("#scene-indicator")
        .text(`${state.scene + 1} / ${scenes.length}`);

    previousButton.property("disabled", state.scene === 0);
    nextButton.property("disabled", state.scene === scenes.length - 1);

    explorationControls.classed("visible", state.scene === 2);

    chart.selectAll("*").remove();
    tooltip.style("display", "none");

    const yearData = data.filter(d => d.Year === state.displayYear);

    drawBaseScatterPlot(yearData);

    if (state.scene === 0) {
        renderSceneOne();
    } else if (state.scene === 1) {
        renderSceneTwo(yearData);
    } else {
        renderSceneThree(data);
    }
}

function drawBaseScatterPlot(yearData) {
    xScale = d3.scaleLog()
        .domain([100, 150000])
        .range([0, width]);

    yScale = d3.scaleLinear()
        .domain([45, 90])
        .range([height, 0]);

    populationScale = d3.scaleSqrt()
        .domain([0, d3.max(yearData, d => d.Population)])
        .range([3, 18]);

    chart.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(
            d3.axisBottom(xScale)
                .ticks(6)
                .tickSize(-height)
                .tickFormat("")
        );

    chart.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(yScale)
                .ticks(8)
                .tickSize(-width)
                .tickFormat("")
        );

    chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(6, "~s"));

    chart.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    chart.append("text")
        .attr("x", width / 2)
        .attr("y", height + 55)
        .attr("text-anchor", "middle")
        .text("GDP per capita, current US dollars (log scale)");

    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -62)
        .attr("text-anchor", "middle")
        .text("Life expectancy at birth (years)");

    chart.append("text")
        .attr("class", "year-label")
        .attr("x", width)
        .attr("y", 18)
        .attr("text-anchor", "end")
        .text(state.displayYear);

    chart.selectAll(".country-point")
        .data(yearData, d => d.CountryCode)
        .enter()
        .append("circle")
        .attr("class", "country-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", d => populationScale(d.Population))
        .attr("fill", d => regionColors(d.Region))
        .attr("opacity", 0.72);

    drawLegend();
}

function renderSceneOne() {
    chart.selectAll(".country-point")
        .attr("opacity", 0)
        .transition()
        .duration(900)
        .attr("opacity", 0.72);

    addAnnotation(
        500,
        95,
        "A clear upward pattern",
        "Most countries with higher income also report longer life expectancy."
    );
}

function renderSceneTwo(yearData) {
    const highlightedCountries = new Set([
        "Costa Rica",
        "Vietnam",
        "Cuba"
    ]);

    chart.selectAll(".country-point")
        .transition()
        .duration(700)
        .attr("opacity", d =>
            highlightedCountries.has(d.Country) ? 1 : 0.12
        )
        .attr("stroke-width", d =>
            highlightedCountries.has(d.Country) ? 2.5 : 0.8
        );

    chart.selectAll(".highlight-label")
        .data(yearData.filter(d => highlightedCountries.has(d.Country)))
        .enter()
        .append("text")
        .attr("class", "highlight-label")
        .attr("x", d => xScale(d.GDPPerCapita) + 10)
        .attr("y", d => yScale(d.LifeExpectancy) - 8)
        .text(d => d.Country);

    addAnnotation(
        470,
        105,
        "Different paths to better health",
        "Some countries achieve relatively long lives without reaching the world's highest income levels."
    );
}

function renderSceneThree(allData) {
    chart.selectAll(".country-point")
        .attr("opacity", d => {
            if (!state.selectedCountry) {
                return 0.68;
            }
            return d.Country === state.selectedCountry ? 1 : 0.08;
        })
        .attr("stroke-width", d =>
            d.Country === state.selectedCountry ? 3 : 0.8
        )
        .on("mouseover", function (event, d) {
            tooltip
                .style("display", "block")
                .html(`
                    <strong>${d.Country}</strong><br>
                    Region: ${d.Region}<br>
                    GDP per capita: $${d3.format(",.0f")(d.GDPPerCapita)}<br>
                    Life expectancy: ${d.LifeExpectancy.toFixed(1)} years<br>
                    Population: ${d3.format(",")(d.Population)}
                `);
        })
        .on("mousemove", function (event) {
            const container = document
                .querySelector(".chart-container")
                .getBoundingClientRect();

            tooltip
                .style("left", `${event.clientX - container.left + 15}px`)
                .style("top", `${event.clientY - container.top + 15}px`);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

    if (state.selectedCountry) {
        drawCountryPath(allData, state.selectedCountry);
    }

    addAnnotation(
        495,
        65,
        "Now explore the data",
        "Hover over countries or use the dropdown to follow one country's development path."
    );
}

function drawCountryPath(data, countryName) {
    const countryData = data
        .filter(d => d.Country === countryName)
        .sort((a, b) => a.Year - b.Year);

    if (countryData.length === 0) {
        return;
    }

    const line = d3.line()
        .x(d => xScale(d.GDPPerCapita))
        .y(d => yScale(d.LifeExpectancy));

    chart.append("path")
        .datum(countryData)
        .attr("class", "country-path")
        .attr("fill", "none")
        .attr("stroke", "#111827")
        .attr("stroke-width", 2.5)
        .attr("d", line);

    chart.selectAll(".trajectory-point")
        .data(countryData)
        .enter()
        .append("circle")
        .attr("class", "trajectory-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", 3)
        .attr("fill", "#111827");

    const first = countryData[0];
    const last = countryData[countryData.length - 1];

    chart.append("text")
        .attr("class", "trajectory-label")
        .attr("x", xScale(first.GDPPerCapita) + 6)
        .attr("y", yScale(first.LifeExpectancy) + 16)
        .text(first.Year);

    chart.append("text")
        .attr("class", "trajectory-label")
        .attr("x", xScale(last.GDPPerCapita) + 6)
        .attr("y", yScale(last.LifeExpectancy) - 8)
        .text(last.Year);
}

function drawLegend() {
    const items = regionColors.domain();

    const legend = chart
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 225},${height - 160})`);

    const rows = legend
        .selectAll(".legend-row")
        .data(items)
        .enter()
        .append("g")
        .attr("class", "legend-row")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    rows.append("circle")
        .attr("r", 5)
        .attr("fill", d => regionColors(d));

    rows.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .text(d => d);
}

function addAnnotation(x, y, title, body) {
    const annotation = chart
        .append("g")
        .attr("class", "annotation")
        .attr("transform", `translate(${x},${y})`);

    annotation.append("rect")
        .attr("x", -12)
        .attr("y", -24)
        .attr("width", 290)
        .attr("height", 76)
        .attr("rx", 8)
        .attr("fill", "white")
        .attr("stroke", "#d9dde1");

    annotation.append("text")
        .attr("class", "annotation-title")
        .text(title);

    const bodyText = annotation
        .append("text")
        .attr("class", "annotation-body")
        .attr("y", 22);

    wrapText(bodyText, body, 255);
}

function wrapText(textSelection, text, maxWidth) {
    const words = text.split(/\s+/);
    let line = [];

    let tspan = textSelection
        .append("tspan")
        .attr("x", 0)
        .attr("dy", 0);

    words.forEach(word => {
        line.push(word);
        tspan.text(line.join(" "));

        if (tspan.node().getComputedTextLength() > maxWidth) {
            line.pop();
            tspan.text(line.join(" "));

            line = [word];

            tspan = textSelection
                .append("tspan")
                .attr("x", 0)
                .attr("dy", "1.2em")
                .text(word);
        }
    });
}

init().catch(error => {
    console.error("Failed to load the data:", error);

    d3.select("#scene-description")
        .text("The visualization could not load its data. Check the console for details.");
});
