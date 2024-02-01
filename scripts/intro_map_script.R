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

# import datasets
Agricultural <- mx_read("spatial_data/vectors/Agricultural")
Cultural <- mx_read("spatial_data/vectors/Agricultural")
Clearcut <- mx_read("spatial_data/vectors/Agricultural")
CoastalBluff <- mx_read("spatial_data/vectors/Agricultural")
DavidsonCreek <- mx_read("spatial_data/vectors/Agricultural")
Developed <- mx_read("spatial_data/vectors/Agricultural")
Dock <- mx_read("spatial_data/vectors/Agricultural")
EelgrassSimplified <- mx_read("spatial_data/vectors/EelgrassSimplified")
GreigCreek <- mx_read("spatial_data/vectors/GreigCreek")
LaughlinLake <- mx_read("spatial_data/vectors/LaughlinLake")
MatureForest <- mx_read("spatial_data/vectors/Agricultural")
PoleSapling <- mx_read("spatial_data/vectors/Agricultural")
Pond <- mx_read("spatial_data/vectors/Agricultural")
ProjectBoundary <- mx_read("spatial_data/vectors/ProjectBoundary")
Riparian <- mx_read("spatial_data/vectors/Agricultural")
Road <- mx_read("spatial_data/vectors/Agricultural")
Rural <- mx_read("spatial_data/vectors/Agricultural")
Shoreline <- mx_read("spatial_data/vectors/Agricultural")
Subtidal <- mx_read("spatial_data/vectors/Agricultural")
Wetland <- mx_read("spatial_data/vectors/Agricultural")
Woodland <- mx_read("spatial_data/vectors/Agricultural")
YoungForest <- mx_read("spatial_data/vectors/Agricultural")

layerStyling <- timedFread("spatial_data/vectors/layerStyling.csv")

mx_intro_map <- function () {
  title <- "Xetthecum Introduction";
  
  # Plot map
  introMap <- leaflet(options=list(mx_mapId="Introduction")) %>%
    fitBounds(-123.513, 48.954, -123.491, 48.936) %>%
    addProviderTiles(providers$CartoDB.Positron)
  
    for (i in 1:nrow(layerStyling)) {
      row <- layerStyling[i,]
      introMap <- introMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                          fillColor = row$fillColor, 
                                          fillOpacity = as.numeric(row$fillOpacity), 
                                          weight = 0,
                                          options = list(mx_layerId = row$Layer, className = row$ClassName))
    }
  
  #Note that this statement is only effective in standalone R
  print(introMap) 
  

}

mx_intro_map()
