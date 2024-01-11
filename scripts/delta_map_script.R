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

#Layer 1: Greig Creek vector
GreigCreek <- mx_read("spatial_data/vectors/GreigCreek")
#Layer 2: Retreat Cove vector
RetreatCove <- mx_read("spatial_data/vectors/RetreatCove")
#Layer 3: Laughlin Lake vector
LaughlinLake <- mx_read("spatial_data/vectors/LaughlinLake")
#Layer 4: Delta vector
Delta <- mx_read("spatial_data/vectors/Delta")

mx_delta_map <- function () {
  title <- "Delta";
  
  # Plot map
  deltaMap <- leaflet(options=list(mx_mapId="Delta")) %>%
    fitBounds(-123.503, 48.942, -123.500, 48.940) %>%
    addTiles(options = providerTileOptions(opacity = 0.5)) %>%
    addPolygons(data = Delta,
              fillColor = "lightskyblue",
              fillOpacity = 0.7,
              weight = 1,
              options=list(mx_layerId="Delta"))
 
  
  # Draw the gridded data in a funny way so that richness, cell_id etc. can be tunneled through options one at a time
  # for (i in 1:nrow(choropleth)) {
  #   row <- choropleth[i,]
  #   introMap <- introMap %>% addPolygons(data = row, fillColor = pal(row$richness), fillOpacity = 0.4, weight = 0,
  #                                                popup = paste("Richness:", row$richness), 
  #                                                popupOptions = popupOptions(closeButton = FALSE),
  #                                                options = mx_diversityRowToOptions(row))
  # }
  
  #Note that this statement is only effective in standalone R
  print(deltaMap) 
  

}
