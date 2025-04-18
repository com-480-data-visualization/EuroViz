# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Linn Rågmo     | 404098 |
| Isac Hansson   | 404090 |
| William Frisk  | 404088 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

_(max. 2000 characters per section)_

### Dataset

We’ve decided to use the following dataset with data on the Eurovision song contest: https://github.com/Spijkervet/eurovision-dataset. The dataset scrapes the following feature from the EurovisionWorld website and stores it in csv files:

Data on contestants:

- Contest year
- Country
- Country code
- Artist
- Song title
- Participated in semi final
- Order in semi final broadcast
- Order in final broadcast
- Place in final
- Score in final
- Place in semi-final
- Score in semi-final
- Televoting points in final
- Jury points in final
- Televoting points in semi-final
- Jury points in semi-final
- Song lyrics
- URL to youtube video

Data on votes:

- Contest year
- Round
- Country code that is giving the points
- Country code that is receiving the points
- Number of given points

Data on betting odds:

- Betting company name
- Betting score
- Year
- Performer
- Song
- Url of the bet
- Contest round
- Country name
- Country code

We estimate that the data will require relatively little data-cleaning / preprocessing since the main features we are interested in are already present in the dataset. However, we will need to tackle the fact that the rules of the competition have changed a bit over the years. For example, in 2004-2008 there was only one semi-final and televoting was introduced first in 2016. Further, the dataset contains NaN values and sometimes multiple values in a field which will need to be handled before the data can be visualised properly. We will also need to handle the fact that not every country has been competing at every instance of the competition.

### Problematic

With the dataset we want to effectively display the distribution of votes in the Eurovision Song Contest over time. One of the visualizations we plan to include is an interactive map that, by clicking on a certain country, shows how they voted and who voted for them. This interactive map will have different filters such as showing results for a certain year or an average over a time period, jury or televotes and received votes and submitted votes.

By doing this we aim to contribute to a deeper understanding of how different countries tend to vote. This is interesting due to a number of factors. For example, it would be interesting to see if voting tendencies align with preconceived notions about the countries' relationships. Another interesting thing we also want to visualize is the differences in jury points and televoting points which could provide quite interesting insights.

This visual aid for analysis is mainly targeted to Eurovision watchers and fans. The visualization will provide interesting information about the competition for people that are engaged with the competition. However, we also imagine that our visualizations could be used by tv channels and newspapers during the reporting of the current year’s competitions in Basel or competitions in future. This way reporters could provide a visual presentation of historic data about the competition to their audience.

### Exploratory Data Analysis

We spent some time pre-processing the data. Since the contest has been running since 1956, various changes have occurred, such as the number of participants, the introduction of semifinals, and evolving voting rules. These changes have led to sparse data with many null values, as some information is available only for certain years. To handle this, we structured our model by year so we can easily manage the differing conditions for each year. We merge the data of contestans and the data of the votes to create an object that we in the future could paginate our visualizations by year. The resulting object have the following structure:
```json
{
  ["year": [{
    "country": {
      "participated": Boolean, 
      "metadata": { 
        ...
      },
      "votes": {
        "total_votes": Number,
        "jury_votes": Number,
        "tele_votes": Number
      }
    }
  },]
,]}
```

 The data is collected from 1957-2023 and contains 54 different countries, which together account for 1,734 song entries. We have a lot of null values when the competition changes rules, for example fields like "Place in semi-final" and "Score in semi-final" are null for all years prior to the introduction of the semi-final rounds.

See further statistics and pre-processing [here](https://github.com/com-480-data-visualization/EuroViz/blob/master/pre-processing/stats.ipynb).
### Related work

This data has been used before to create visualizations about the contest. The previous work we have been able to find has presented, for example, data on participating countries, what makes a winning song and high-level overviews of country-country voting relations, see for example https://flourish.studio/blog/visualizing-eurovision-data/ and https://www.yellowfinbi.com/blog/data-visualization-shows-most-successful-eurovision-nations.

Our main visualization idea is to build a map of the contestants (countries) and analyze what each country votes on. We take inspiration from, for example, maps in elections which show voting results in different states or regions of a country, see https://edition.cnn.com/election/2024/electoral-college-map?game-id=2024-PG-CNN-ratings&game-view=map.

Our approach is original due to the fact that we combine the data about country vote statistics with the visualization approach of a geographic map. This way, even though the data has previously been used to get insights into voting patterns etc. we distinguish ourselves by providing a (to the extent of our research) novel visualization of it.

We have not explored the dataset in any other context besides this course.

## Milestone 2 (18th April, 5pm)

**10% of the final grade**

### Resources

All of the lectures have provided us with a solid foundation in data visualization, enabling us to create our Eurovision map. However, the following are the most relevant:

- Lecture on Practical Maps: GeoJSON/TopoJSON to describe content of the geographical map and D3 projection for drag and zoom functionality
- Lecture on Perception and Color: The theory from the lecture will be used to create intuitive and effective data visualizations

### Goal

Our main goal is to implement an interactive map of Europe where users can click or hover over a country to show the top countries the selected country has voted for. The MVP just involves aggregating the total votes over all time or selecting a single contest year. See sketch below:

<img src="./sketches/main-no-select.jpg" alt="Main idea with no country selected" width="500"/>

And after a country has been selected:

<img src="./sketches/main-country-selected.jpg" alt="Main idea with a country selected" width="500"/>

This core visualization can itself be broken down into independent parts to implement.

- We need to implement a map of Europe where we can select countries by clicking or hovering over them.
- We need to implement arrows that can go from a given start country to a given destination country on the map and change size (or similar) depending on votes.
- We also need to implement a selector for years that filters the data based on a given contest year.

However, this MVP can be developed into a more extensive visualization. Here are some stretch goals we aim for after the main visualization is complete:

- We would like for the user to be able to filter on a range of years instead of just a single year. That way the user could compare say 1960-1970 and 2000-2010 to see how it differs.
- We would also like some similar but different map visualizations where we color each country based on how many accumulative votes they’ve gotten over a range of years, how many times they won over a range of years and how many times they’ve finished last over a range of years. See sketch below (note that the colors would be on a country by country basis in the final version):

  <img src="./sketches/color-gradient.jpg" alt="Gradient colored map" width="500"/>

- Another interesting visualization to make would be a line or bar graph where the user could select two countries and we would show how much the two countries have voted for each other through history.

If there is even more time available to us we could move on from the vote and map part of the dataset and visualization and move on to analyzing other parts of the data. For example the lyrics of songs where we could analyze what languages tend to perform best or what words are most common in winning songs. This could be visualized quite simply in bar graphs. We could also graph differences in jury and televotes for countries by year.

## Milestone 3 (30th May, 5pm)

**80% of the final grade**

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
