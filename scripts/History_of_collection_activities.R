# Map history of vascular plant surveys in Átl’ka7tsem

# Load libraries

library(dplyr)
library(gapminder)
library(gganimate)
library(ggplot2)
library(ggthemes)
library(gifski)
library(hrbrthemes)
library(leaflet)
library(raster)
library(sf)
library(tidyr)
library(viridis)

library(plotly)

# Source dependencies

source("scripts/utils.R")

# Analysis of historical collection activities

plants <- read.csv("tabular_data/Howe_Sound_vascular_plant_records_consolidated.csv")

plants$yearRecorded <- as.numeric(substr(plants$eventDate, 1, 4))

plants <- plants %>% drop_na(yearRecorded)

min(plants$yearRecorded) # Earliest record dates to 1897 

plants.1890.1900 <- plants %>% filter(between(yearRecorded,1890,1900))
plants.1890.1910 <- plants %>% filter(between(yearRecorded,1890,1910))
plants.1890.1920 <- plants %>% filter(between(yearRecorded,1890,1920))
plants.1890.1930 <- plants %>% filter(between(yearRecorded,1890,1930))
plants.1890.1940 <- plants %>% filter(between(yearRecorded,1890,1940))
plants.1890.1950 <- plants %>% filter(between(yearRecorded,1890,1950))
plants.1890.1960 <- plants %>% filter(between(yearRecorded,1890,1960))
plants.1890.1970 <- plants %>% filter(between(yearRecorded,1890,1970))
plants.1890.1980 <- plants %>% filter(between(yearRecorded,1890,1980))
plants.1890.1990 <- plants %>% filter(between(yearRecorded,1890,1990))
plants.1890.2000 <- plants %>% filter(between(yearRecorded,1890,2000))
plants.1890.2010 <- plants %>% filter(between(yearRecorded,1890,2010))
plants.1890.2020 <- plants %>% filter(between(yearRecorded,1890,2020))
plants.1890.2022 <- plants %>% filter(between(yearRecorded,1890,2022))

y.1900 <- 1900
y.1900.cum.obs <- nrow(plants.1890.1900) # cumulative no. observations
y.1900.cum.spp <- length(unique(plants.1890.1900$scientificName)) # cumulative no. species
y.1900.cum.ind <- length(unique(plants.1890.1900$recordedBy)) # cumulative observers
y.1900.obs <- nrow(plants.1890.1900) # no. observations
y.1900.spp <- length(unique(plants.1890.1900$scientificName)) # no. species
y.1900.ind <- length(unique(plants.1890.1900$recordedBy)) # no. observers

y.1910 <- 1910
y.1910.cum.obs <- nrow(plants.1890.1910) # cumulative no. observations
y.1910.cum.spp <- length(unique(plants.1890.1910$scientificName)) # cumulative no. species
y.1910.cum.ind <- length(unique(plants.1890.1910$recordedBy)) # cumulative observers
y.1910.obs <- nrow(plants.1890.1910) - nrow(plants.1890.1900) # no. obs
y.1910.spp <- y.1910.cum.spp - y.1900.cum.spp # no. species
y.1910.ind <- y.1910.cum.ind - y.1900.cum.ind # no. observers

y.1920 <- 1920
y.1920.cum.obs <- nrow(plants.1890.1920) # cumulative no. observations
y.1920.cum.spp <- length(unique(plants.1890.1920$scientificName)) # cumulative no. species
y.1920.cum.ind <- length(unique(plants.1890.1920$recordedBy)) # cumulative observers
y.1920.obs <- nrow(plants.1890.1920) - nrow(plants.1890.1910) # no. obs
y.1920.spp <- y.1920.cum.spp - y.1910.cum.spp # no. species
y.1920.ind <- y.1920.cum.ind - y.1910.cum.ind # no. observers

y.1930 <- 1930
y.1930.cum.obs <- nrow(plants.1890.1930) # cumulative no. observations
y.1930.cum.spp <- length(unique(plants.1890.1930$scientificName)) # cumulative no. species
y.1930.cum.ind <- length(unique(plants.1890.1930$recordedBy)) # cumulative observers
y.1930.obs <- nrow(plants.1890.1930) - nrow(plants.1890.1920) # no. obs
y.1930.spp <- y.1930.cum.spp - y.1920.cum.spp # no. species
y.1930.ind <- y.1930.cum.ind - y.1920.cum.ind # no. observers

y.1940 <- 1940
y.1940.cum.obs <- nrow(plants.1890.1940) # cumulative no. observations
y.1940.cum.spp <- length(unique(plants.1890.1940$scientificName)) # cumulative no. species
y.1940.cum.ind <- length(unique(plants.1890.1940$recordedBy)) # cumulative observers
y.1940.obs <- nrow(plants.1890.1940) - nrow(plants.1890.1930) # no. obs
y.1940.spp <- y.1940.cum.spp - y.1930.cum.spp # no. species
y.1940.ind <- y.1940.cum.ind - y.1930.cum.ind # no. observers

y.1950 <- 1950
y.1950.cum.obs <- nrow(plants.1890.1950) # cumulative no. observations
y.1950.cum.spp <- length(unique(plants.1890.1950$scientificName)) # cumulative no. species
y.1950.cum.ind <- length(unique(plants.1890.1950$recordedBy)) # cumulative observers
y.1950.obs <- nrow(plants.1890.1950) - nrow(plants.1890.1940) # no. obs
y.1950.spp <- y.1950.cum.spp - y.1940.cum.spp # no. species
y.1950.ind <- y.1950.cum.ind - y.1940.cum.ind # no. observers

y.1960 <- 1960
y.1960.cum.obs <- nrow(plants.1890.1960) # cumulative no. observations
y.1960.cum.spp <- length(unique(plants.1890.1960$scientificName)) # cumulative no. species
y.1960.cum.ind <- length(unique(plants.1890.1960$recordedBy)) # cumulative observers
y.1960.obs <- nrow(plants.1890.1960) - nrow(plants.1890.1950) # no. obs
y.1960.spp <- y.1960.cum.spp - y.1950.cum.spp # no. species
y.1960.ind <- y.1960.cum.ind - y.1950.cum.ind # no. observers

y.1970 <- 1970
y.1970.cum.obs <- nrow(plants.1890.1970) # cumulative no. observations
y.1970.cum.spp <- length(unique(plants.1890.1970$scientificName)) # cumulative no. species
y.1970.cum.ind <- length(unique(plants.1890.1970$recordedBy)) # cumulative observers
y.1970.obs <- nrow(plants.1890.1970) - nrow(plants.1890.1960) # no. obs
y.1970.spp <- y.1970.cum.spp - y.1960.cum.spp # no. species
y.1970.ind <- y.1970.cum.ind - y.1960.cum.ind # no. observers

y.1980 <- 1980
y.1980.cum.obs <- nrow(plants.1890.1980) # cumulative no. observations
y.1980.cum.spp <- length(unique(plants.1890.1980$scientificName)) # cumulative no. species
y.1980.cum.ind <- length(unique(plants.1890.1980$recordedBy)) # cumulative observers
y.1980.obs <- nrow(plants.1890.1980) - nrow(plants.1890.1970) # no. obs
y.1980.spp <- y.1980.cum.spp - y.1970.cum.spp # no. species
y.1980.ind <- y.1980.cum.ind - y.1970.cum.ind # no. observers

y.1990 <- 1990
y.1990.cum.obs <- nrow(plants.1890.1990) # cumulative no. observations
y.1990.cum.spp <- length(unique(plants.1890.1990$scientificName)) # cumulative no. species
y.1990.cum.ind <- length(unique(plants.1890.1990$recordedBy)) # cumulative observers
y.1990.obs <- nrow(plants.1890.1990) - nrow(plants.1890.1980) # no. obs
y.1990.spp <- y.1990.cum.spp - y.1980.cum.spp # no. species
y.1990.ind <- y.1990.cum.ind - y.1980.cum.ind # no. observers

y.2000 <- 2000
y.2000.cum.obs <- nrow(plants.1890.2000) # cumulative no. observations
y.2000.cum.spp <- length(unique(plants.1890.2000$scientificName)) # cumulative no. species
y.2000.cum.ind <- length(unique(plants.1890.2000$recordedBy)) # cumulative observers
y.2000.obs <- nrow(plants.1890.2000) - nrow(plants.1890.1990) # no. obs
y.2000.spp <- y.2000.cum.spp - y.1990.cum.spp # no. species
y.2000.ind <- y.2000.cum.ind - y.1990.cum.ind # no. observers

y.2010 <- 2010
y.2010.cum.obs <- nrow(plants.1890.2010) # cumulative no. observations
y.2010.cum.spp <- length(unique(plants.1890.2010$scientificName)) # cumulative no. species
y.2010.cum.ind <- length(unique(plants.1890.2010$recordedBy)) # cumulative observers
y.2010.obs <- nrow(plants.1890.2010) - nrow(plants.1890.2000) # no. obs
y.2010.spp <- y.2010.cum.spp - y.2000.cum.spp # no. species
y.2010.ind <- y.2010.cum.ind - y.2000.cum.ind # no. observers

y.2020 <- 2020
y.2020.cum.obs <- nrow(plants.1890.2020) # cumulative no. observations
y.2020.cum.spp <- length(unique(plants.1890.2020$scientificName)) # cumulative no. species
y.2020.cum.ind <- length(unique(plants.1890.2020$recordedBy)) # cumulative observers
y.2020.obs <- nrow(plants.1890.2020) - nrow(plants.1890.2010) # no. obs
y.2020.spp <- y.2020.cum.spp - y.2010.cum.spp # no. species
y.2020.ind <- y.2020.cum.ind - y.2010.cum.ind # no. observers

y.2022 <- 2022
y.2022.cum.obs <- nrow(plants.1890.2022) # cumulative no. observations
y.2022.cum.spp <- length(unique(plants.1890.2022$scientificName)) # cumulative no. species
y.2022.cum.ind <- length(unique(plants.1890.2022$recordedBy)) # cumulative observers
y.2022.obs <- nrow(plants.1890.2022) - nrow(plants.1890.2020) # no. obs
y.2022.spp <- y.2022.cum.spp - y.2020.cum.spp # no. species
y.2022.ind <- y.2022.cum.ind - y.2020.cum.ind # no. observers

year <- c(y.1900,y.1910,y.1920,y.1930,y.1940,y.1950,y.1960,y.1970,y.1980,y.1990,y.2000,y.2010,y.2020,y.2022)
obs <- c(y.1900.obs,y.1910.obs,y.1920.obs,y.1930.obs,y.1940.obs,y.1950.obs,y.1960.obs,y.1970.obs,y.1980.obs,y.1990.obs,y.2000.obs,y.2010.obs,y.2020.obs,y.2022.obs)
spp <- c(y.1900.spp,y.1910.spp,y.1920.spp,y.1930.spp,y.1940.spp,y.1950.spp,y.1960.spp,y.1970.spp,y.1980.spp,y.1990.spp,y.2000.spp,y.2010.spp,y.2020.spp,y.2022.spp)
ind <- c(y.1900.ind,y.1910.ind,y.1920.ind,y.1930.ind,y.1940.ind,y.1950.ind,y.1960.ind,y.1970.ind,y.1980.ind,y.1990.ind,y.2000.ind,y.2010.ind,y.2020.ind,y.2022.ind)
cum.obs <- c(y.1900.cum.obs,y.1910.cum.obs,y.1920.cum.obs,y.1930.cum.obs,y.1940.cum.obs,y.1950.cum.obs,y.1960.cum.obs,y.1970.cum.obs,y.1980.cum.obs,y.1990.cum.obs,y.2000.cum.obs,y.2010.cum.obs,y.2020.cum.obs,y.2022.cum.obs)
cum.spp <- c(y.1900.cum.spp,y.1910.cum.spp,y.1920.cum.spp,y.1930.cum.spp,y.1940.cum.spp,y.1950.cum.spp,y.1960.cum.spp,y.1970.cum.spp,y.1980.cum.spp,y.1990.cum.spp,y.2000.cum.spp,y.2010.cum.spp,y.2020.cum.spp,y.2022.cum.spp)
cum.ind <- c(y.1900.cum.ind,y.1910.cum.ind,y.1920.cum.ind,y.1930.cum.ind,y.1940.cum.ind,y.1950.cum.ind,y.1960.cum.ind,y.1970.cum.ind,y.1980.cum.ind,y.1990.cum.ind,y.2000.cum.ind,y.2010.cum.ind,y.2020.cum.ind,y.2022.cum.ind)

history <- data.frame(year,obs,spp,ind,cum.obs,cum.spp,cum.ind)

# Plot

# speciesPlot <- plot_ly(width=700, height=420, x=year, y=cum.spp, type='scatter', mode='lines') %>%
#     layout(title='Vascular plant species recorded in Átl’ḵa7tsem/Howe Sound 1890-2022', yaxis=list(title='Reported Species'), xaxis = list(title="Year"))
# 
# speciesPlot


speciesPlot <- plot_ly(width = 700, height = 420)

speciesPlot <- speciesPlot %>%
      layout(title='Vascular plant species recorded in Átl’ḵa7tsem/Howe Sound 1890-2022', showlegend = FALSE,
      xaxis = list(title="Year", range = c(1900, 2022)),
      yaxis = list(title='Reported Species', range=c(0, max(cum.spp)))
      )

# speciesPlot <- add_lines(speciesPlot, x=year, y=cum.spp, type='scatter', mode='lines') 

steps <- list()

# General method cribbed from https://plotly.com/r/sliders/#sine-wave-slider

for (i in 1:length(year)) {
    args <- list('visible', rep(FALSE, length(year)))
    args[[2]][i] = TRUE
    steps[[i]] <- list(label = year[[i]], method="restyle", args=args)
    sppRange <- cum.spp[1:i]
    yearRange <- year[1:i]
    speciesPlot <- speciesPlot %>% add_lines(x=yearRange, y=sppRange, line=list(color='green'), type='scatter', mode='lines', visible = i == 1)
}

speciesPlot <- layout(speciesPlot, meta = list(mx_widgetId = "speciesPlot"), 
                      sliders = list(list(active=0, steps = steps)))

speciesPlot

# plot <- history %>% 
#   ggplot(aes(x = year, y = cum.spp, color = 'green')) +
#   geom_line(alpha=0.8) + 
#   geom_point(size=2) +
#   labs(title="Vascular plant species recorded in Átl’ka7tsem/Howe Sound 1890-2022",
#        caption="Source: Átl’ka7tsem/Howe Sound Biosphere Region Initiative")+
#   ylab('Reported Species')+xlab('Year') + 
#   theme_solarized_2(light=F) +
#   theme(text=element_text(colour="#EEEEEE"),
#         title=element_text(colour="#EEEEEE",size=9,face = "bold"),
#         plot.title=element_text(hjust=0.5),
#         axis.title.x = element_blank(),
#         panel.grid.minor.x=element_blank(),
#         plot.margin = unit(c(0.5,1.3,0.5,0.5), "cm")) + 
#   theme(legend.position="none") +
#   transition_reveal(year)
# 
# animate(
#   plot = plot,
#   render = gifski_renderer(),
#   height = 420,
#   width = 700, 
#   duration = 5,
#   fps = 30,
#   res = 100,
#   end_pause = 120)

# Supress saving gif
# anim_save('../outputs/plants.gif')

# Most historical data collected in the 1920s and between the 1960s and 1980s;
# Large increase in observations and recorded species with the emergence of 
# iNaturalist in 2010s; no. species reported for Howe Sound has nearly doubled 
# over the last two decades


# Plot gridded choropleth illustrating historical timeline of plant surveys 1897-2022

# Note: this plot adds one layer, including cumulative series of features for multiple decades
# to illustrate historical timeline;
# alternatively, we might add multiple layers of gridded species richness, one for each decade
# The final two years (2020-2022) are missing because R was not able to process that dataset

# Load map layers

# Layer 1: hillshade raster
hillshade <- raster("spatial_data/rasters/Hillshade_80m.tif")

# Layer 2: coastline
coastline <- mx_read("spatial_data/vectors/Islands_and_Mainland")

# Layer 3: watershed boundary
watershed.boundary <- mx_read("spatial_data/vectors/Howe_Sound")

# Layer 4: gridded history choropleth
gridded.history <- mx_read("spatial_data/vectors/gridded_history")

gridded.history <- gridded.history %>% drop_na(richness)

# Create color palette for species richness

richness <- gridded.history$richness
values <- richness %>% unique
values <- sort(values)
t <- length(values)
pal <- leaflet::colorFactor(viridis_pal(option = "D")(t), domain = values)

history.1900 <- filter(gridded.history, year == 1900)
history.1910 <- filter(gridded.history, year == 1910)
history.1920 <- filter(gridded.history, year == 1920)
history.1930 <- filter(gridded.history, year == 1930)
history.1940 <- filter(gridded.history, year == 1940)
history.1950 <- filter(gridded.history, year == 1950)
history.1960 <- filter(gridded.history, year == 1960)
history.1970 <- filter(gridded.history, year == 1970)
history.1980 <- filter(gridded.history, year == 1980)
history.1990 <- filter(gridded.history, year == 1990)
history.2000 <- filter(gridded.history, year == 2000)
history.2010 <- filter(gridded.history, year == 2010)
history.2020 <- filter(gridded.history, year == 2020)
history.2022 <- filter(gridded.history, year == 2022)

# Plot map

heatMap <- leaflet(options=list(mx_mapId="History")) %>%
  setView(-123.2194, 49.66076, zoom = 8.5) %>%
  addTiles(options = providerTileOptions(opacity = 0.5)) %>%
  addRasterImage(hillshade, opacity = 0.8) %>%
  addPolygons(data = coastline, color = "black", weight = 1.5, fillOpacity = 0, fillColor = NA) %>%
  # This indices need to agree with positions in array "year"
  addPolygons(data = history.1900, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 0)) %>%
  addPolygons(data = history.1910, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 1)) %>%
  addPolygons(data = history.1920, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 2)) %>%
  addPolygons(data = history.1930, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 3)) %>%
  addPolygons(data = history.1940, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 4)) %>%
  addPolygons(data = history.1950, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 5)) %>%
  addPolygons(data = history.1960, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 6)) %>%
  addPolygons(data = history.1970, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 7)) %>%
  addPolygons(data = history.1980, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 8)) %>%
  addPolygons(data = history.1990, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 9)) %>%
  addPolygons(data = history.2000, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 10)) %>%
  addPolygons(data = history.2010, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 11)) %>%
  addPolygons(data = history.2020, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 12)) %>%
  addPolygons(data = history.2022, fillColor = ~pal(richness), fillOpacity = 0.6, weight = 0, options = list(mx_subLayerIndex = 13)) %>%
  addLegend(position = 'topright',
            colors = viridis_pal(option = "D")(t),
            labels = values) %>%
  addPolygons(data = watershed.boundary, color = "black", weight = 4, fillOpacity = 0)

#Note that this statement is only effective in standalone R
print(heatMap)


