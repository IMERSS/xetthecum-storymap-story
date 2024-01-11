library(sf)
library(leaflet)
library(dplyr)
library(raster)
library(reshape2)
library(rjson)
library(scales)
library(stringr)

# Source dependencies

source("scripts/utils.R")

# #Layer 1: GreigCreek vector
# GreigCreek <- mx_read("spatial_data/vectors/GreigCreek")
# #Layer 2: Delta vector
# RetreatCove <- mx_read("spatial_data/vectors/RetreatCove")
# #Layer 3: Eelgrass vector
# LaughlinLake <- mx_read("spatial_data/vectors/LaughlinLake")

# Note currently disused
mx_historic_map <- function () {
  title <- "Historic and Cultural Significance";
  
  # Plot map
  introMap <- leaflet(options=list(mx_mapId="HistoricSignificance")) %>%
    fitBounds(-123.513, 48.954, -123.491, 48.936) %>%
    addTiles(options = providerTileOptions(opacity = 0.5))
 
  
  # Draw the gridded data in a funny way so that richness, cell_id etc. can be tunneled through options one at a time
  # for (i in 1:nrow(choropleth)) {
  #   row <- choropleth[i,]
  #   introMap <- introMap %>% addPolygons(data = row, fillColor = pal(row$richness), fillOpacity = 0.4, weight = 0,
  #                                                popup = paste("Richness:", row$richness), 
  #                                                popupOptions = popupOptions(closeButton = FALSE),
  #                                                options = mx_diversityRowToOptions(row))
  # }
  
  #Note that this statement is only effective in standalone R
  print(introMap) 
  

}
