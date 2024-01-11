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

#Layer 1: GreigCreek vector
GreigCreek <- mx_read("spatial_data/vectors/GreigCreek")
#Layer 2: Delta vector
RetreatCove <- mx_read("spatial_data/vectors/RetreatCove")
#Layer 3: Eelgrass vector
LaughlinLake <- mx_read("spatial_data/vectors/LaughlinLake")


mx_retreat_map <- function () {
  title <- "Retreat Cove";
  
  # Plot map
  retreatMap <- leaflet(options=list(mx_mapId="Retreat")) %>%
    fitBounds(-123.502, 48.941, -123.499, 48.939) %>%
    addTiles(options = providerTileOptions(opacity = 0.5)) %>%
    addPolylines(data = GreigCreek,
                stroke = TRUE,
                smoothFactor = 0.5,
                fillColor = "lightskyblue",
                fillOpacity = 0.1,
                weight = 0.5,
                options=list(mx_layerId="GreigCreek")) %>%
    addPolygons(data = RetreatCove,
              fillColor = "lightskyblue",
              fillOpacity = 0.7,
              weight = 1,
              options=list(mx_layerId="RetreatCove")) %>%
    addPolygons(data = LaughlinLake,
                fillColor = "lightskyblue",
                fillOpacity = 0.1,
                weight = 0.5,
                options=list(mx_layerId="LaughlinLake"))
 
  
  # Draw the gridded data in a funny way so that richness, cell_id etc. can be tunneled through options one at a time
  # for (i in 1:nrow(choropleth)) {
  #   row <- choropleth[i,]
  #   introMap <- introMap %>% addPolygons(data = row, fillColor = pal(row$richness), fillOpacity = 0.4, weight = 0,
  #                                                popup = paste("Richness:", row$richness), 
  #                                                popupOptions = popupOptions(closeButton = FALSE),
  #                                                options = mx_diversityRowToOptions(row))
  # }
  
  #Note that this statement is only effective in standalone R
  print(retreatMap) 
  

}
