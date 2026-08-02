const state = {
    scene: 0,
    selectedCountry: "",
    displayYear: 2023,
    animationToken: 0
};

const scenes = [
    {
        title: "The world moved upward",
        description:
            "From 2000 to 2023, most countries became richer and life expectancy generally increased."
    },
    {
        title: "Growth is uneven",
        description:
            "By 2023, countries in different income groups still occupied very different parts of the development landscape."
    },
    {
        title: "Every country follows its own path",
        description:
            "Choose a country or hover over a point to explore its development from 2000 to 2023."
    }
];

const svg = d3.select("#chart");
const tooltip = d3.select("#tooltip");
const previousButton = d3.select("#previous-button");
const nextButton = d3.select("#next-button");
const countrySelect = d3.select("#country-select");
const explorationControls = d3.select("#exploration-controls");

const svgHeight = 600;
const svgWidth = 1100;

const margin = {
    top: 50,
    right: 300,
    bottom: 75,
    left: 90
};

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

svg
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let data = [];
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

const incomeGroups = [
    "Low income",
    "Lower middle income",
    "Upper middle income",
    "High income"
];

const incomeColors = d3.scaleOrdinal()
    .domain(incomeGroups)
    .range([
        "#8c6bb1",
        "#4eb3d3",
        "#fdb863",
        "#d73027"
    ])
    .unknown("#b8c0cc");

async function init() {
    data = await d3.csv("data/development.csv", d => ({
        Country: d.Country,
        CountryCode: d.CountryCode,
        Region: d.Region,
        IncomeGroup: d.IncomeGroup,
        Year: +d.Year,
        GDPPerCapita: +d.GDPPerCapita,
        LifeExpectancy: +d.LifeExpectancy,
        Population: +d.Population
    }));

    const countries = Array.from(
        new Set(data.map(d => d.Country))
    ).sort();

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
        renderScene();
    });

    previousButton.on("click", function () {
        if (state.scene > 0) {
            state.scene -= 1;
            renderScene();
        }
    });

    nextButton.on("click", function () {
        if (state.scene < scenes.length - 1) {
            state.scene += 1;
            renderScene();
        }
    });

    renderScene();
}

function renderScene() {
    state.animationToken += 1;

    const scene = scenes[state.scene];

    d3.select("#scene-title").text(scene.title);
    d3.select("#scene-description").text(scene.description);
    d3.select("#scene-indicator")
        .text(`${state.scene + 1} / ${scenes.length}`);

    previousButton.property("disabled", state.scene === 0);
    nextButton.property("disabled", state.scene === scenes.length - 1);

    explorationControls.classed("visible", state.scene === 2);

    chart.selectAll("*").interrupt();
    chart.selectAll("*").remove();
    tooltip.style("display", "none");

    if (state.scene === 0) {
        renderSceneOne();
    } else if (state.scene === 1) {
        renderSceneTwo();
    } else {
        renderSceneThree();
    }
}

function createScales(referenceData) {
    xScale = d3.scaleLog()
        .domain([100, 150000])
        .range([0, width]);

    yScale = d3.scaleLinear()
        .domain([45, 90])
        .range([height, 0]);

    populationScale = d3.scaleSqrt()
        .domain([0, d3.max(referenceData, d => d.Population)])
        .range([3, 18]);
}

function drawAxes() {
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
}

function drawYearLabel(year) {
    return chart.append("text")
        .attr("class", "year-label")
        .attr("x", width + 250)
        .attr("y", 18)
        .attr("text-anchor", "end")
        .text(year);
}

/* Scene 1: animate the global distribution through time. */
function renderSceneOne() {
    const token = state.animationToken;
    const years = [2000, 2005, 2010, 2015, 2020, 2023];
    const referenceData = data.filter(d => d.Year === 2023);

    createScales(referenceData);
    drawAxes();

    const firstYearData = data.filter(d => d.Year === years[0]);

    const points = chart
        .selectAll(".country-point")
        .data(firstYearData, d => d.CountryCode)
        .enter()
        .append("circle")
        .attr("class", "country-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", d => populationScale(d.Population))
        .attr("fill", d => regionColors(d.Region))
        .attr("opacity", 0.72);

    const yearLabel = drawYearLabel(years[0]);

    addSideAnnotation(
        30,
        90,
        "Most countries moved up and right",
        "Over two decades, income and longevity generally increased together."
    );

    drawLegend(regionColors, "Region");

    animateSceneOne(points, yearLabel, years, token);
}

async function animateSceneOne(points, yearLabel, years, token) {
    for (let i = 1; i < years.length; i += 1) {
        if (token !== state.animationToken || state.scene !== 0) {
            return;
        }

        const year = years[i];
        const yearData = data.filter(d => d.Year === year);
        const byCode = new Map(yearData.map(d => [d.CountryCode, d]));

        yearLabel.text(year);

        const transition = points
            .transition()
            .duration(850)
            .ease(d3.easeCubicInOut)
            .attr("cx", d => {
                const next = byCode.get(d.CountryCode);
                return xScale((next || d).GDPPerCapita);
            })
            .attr("cy", d => {
                const next = byCode.get(d.CountryCode);
                return yScale((next || d).LifeExpectancy);
            })
            .attr("r", d => {
                const next = byCode.get(d.CountryCode);
                return populationScale((next || d).Population);
            });

        try {
            await transition.end();
        } catch {
            return;
        }
    }
}

/* Scene 2: use income group instead of region to reveal inequality. */
function renderSceneTwo() {
    const yearData = data.filter(
        d => d.Year === 2023 && incomeGroups.includes(d.IncomeGroup)
    );

    createScales(yearData);
    drawAxes();
    drawYearLabel(2023);

    chart.selectAll(".country-point")
        .data(yearData, d => d.CountryCode)
        .enter()
        .append("circle")
        .attr("class", "country-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", d => populationScale(d.Population))
        .attr("fill", d => incomeColors(d.IncomeGroup))
        .attr("opacity", 0)
        .transition()
        .duration(650)
        .attr("opacity", 0.78);

    addSideAnnotation(
        30,
        90,
        "High-income countries",
        "Most cluster toward the upper-right, combining high income with long life expectancy."
    );

    addSideAnnotation(
        30,
        220,
        "Low-income countries",
        "Many remain concentrated toward the lower-left, showing that the development gap persists."
    );

    drawLegend(incomeColors, "Income group", incomeGroups);
}

/* Scene 3: free exploration with a cleaner trajectory. */
function renderSceneThree() {
    const yearData = data.filter(d => d.Year === 2023);

    createScales(yearData);
    drawAxes();
    drawYearLabel(2023);

    chart.selectAll(".country-point")
        .data(yearData, d => d.CountryCode)
        .enter()
        .append("circle")
        .attr("class", "country-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", d => populationScale(d.Population))
        .attr("fill", d => regionColors(d.Region))
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
            showTooltip(event, d);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    drawLegend(regionColors, "Region");

    if (state.selectedCountry) {
        drawCountryTrajectory(state.selectedCountry);
    }
}

/*
Use milestone years for geometry, but label only the first and last year.
*/
function drawCountryTrajectory(countryName) {
    const milestoneYears = new Set([2000, 2005, 2010, 2015, 2020, 2023]);

    const countryData = data
        .filter(d =>
            d.Country === countryName &&
            milestoneYears.has(d.Year)
        )
        .sort((a, b) => a.Year - b.Year);

    if (countryData.length < 2) {
        return;
    }

    const markerId = "trajectory-arrow";

    const defs = svg.select("defs").empty()
        ? svg.append("defs")
        : svg.select("defs");

    defs.select(`#${markerId}`).remove();

    defs.append("marker")
        .attr("id", markerId)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 9)
        .attr("refY", 0)
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#111827");

    const line = d3.line()
        .x(d => xScale(d.GDPPerCapita))
        .y(d => yScale(d.LifeExpectancy));

    const path = chart.append("path")
        .datum(countryData)
        .attr("class", "country-path")
        .attr("fill", "none")
        .attr("stroke", "#111827")
        .attr("stroke-width", 2.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("marker-end", `url(#${markerId})`)
        .attr("d", line);

    const pathLength = path.node().getTotalLength();

    path
        .attr("stroke-dasharray", `${pathLength} ${pathLength}`)
        .attr("stroke-dashoffset", pathLength)
        .transition()
        .duration(900)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

    chart.selectAll(".trajectory-point")
        .data(countryData)
        .enter()
        .append("circle")
        .attr("class", "trajectory-point")
        .attr("cx", d => xScale(d.GDPPerCapita))
        .attr("cy", d => yScale(d.LifeExpectancy))
        .attr("r", d =>
            d.Year === 2000 || d.Year === 2023 ? 5 : 3.5
        )
        .attr("fill", d =>
            d.Year === 2000 || d.Year === 2023
                ? "#111827"
                : "white"
        )
        .attr("stroke", "#111827")
        .attr("stroke-width", 2)
        .on("mouseover", function (event, d) {
            showTooltip(event, d);
        })
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);

    const endpoints = [
        countryData[0],
        countryData[countryData.length - 1]
    ];

    chart.selectAll(".trajectory-label")
        .data(endpoints)
        .enter()
        .append("text")
        .attr("class", "trajectory-label")
        .attr("x", d => xScale(d.GDPPerCapita) + 7)
        .attr("y", d =>
            d.Year === 2000
                ? yScale(d.LifeExpectancy) + 18
                : yScale(d.LifeExpectancy) - 10
        )
        .text(d => d.Year);

    const last = countryData[countryData.length - 1];

    chart.append("text")
        .attr("class", "trajectory-country-label")
        .attr("x", xScale(last.GDPPerCapita) + 10)
        .attr("y", yScale(last.LifeExpectancy) + 18)
        .text(countryName);
}

function showTooltip(event, d) {
    tooltip
        .style("display", "block")
        .html(`
            <strong>${d.Country} — ${d.Year}</strong><br>
            Region: ${d.Region}<br>
            Income group: ${d.IncomeGroup}<br>
            GDP per capita: $${d3.format(",.0f")(d.GDPPerCapita)}<br>
            Life expectancy: ${d.LifeExpectancy.toFixed(1)} years<br>
            Population: ${d3.format(",")(d.Population)}
        `);

    moveTooltip(event);
}

function moveTooltip(event) {
    const container = document
        .querySelector(".chart-container")
        .getBoundingClientRect();

    tooltip
        .style("left", `${event.clientX - container.left + 15}px`)
        .style("top", `${event.clientY - container.top + 15}px`);
}

function hideTooltip() {
    tooltip.style("display", "none");
}

function drawLegend(scale, title, items = scale.domain()) {
    const legend = chart
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 35},${height - 170})`);

    legend.append("text")
        .attr("class", "legend-title")
        .attr("y", -12)
        .text(title);

    const rows = legend
        .selectAll(".legend-row")
        .data(items)
        .enter()
        .append("g")
        .attr("class", "legend-row")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    rows.append("circle")
        .attr("r", 5)
        .attr("fill", d => scale(d));

    rows.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .text(d => d);
}

function addSideAnnotation(xOffset, y, title, body) {
    addAnnotation(width + xOffset, y, title, body);
}

function addAnnotation(x, y, title, body) {
    const annotation = chart
        .append("g")
        .attr("class", "annotation")
        .attr("transform", `translate(${x},${y})`);

    annotation.append("rect")
        .attr("x", -12)
        .attr("y", -24)
        .attr("width", 245)
        .attr("height", 90)
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

    wrapText(bodyText, body, 215);
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
