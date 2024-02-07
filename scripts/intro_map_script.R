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
layerStyling <- timedFread("tabular_data/layerStyling.csv")

mx_intro_map <- function () {
  title <- "Xetthecum Introduction";
  
  # Plot map
  introMap <- leaflet(options=list(mx_mapId="Introduction")) %>%
    fitBounds(-123.48628, 48.92133,-123.52607, 48.97525) %>%
    addProviderTiles(providers$CartoDB.Positron)
    
    for (i in 1:nrow(layerStyling)) {
      row <- layerStyling[i,]
      introMap <- introMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                          fillColor = row$fillColor, 
                                          fillOpacity = as.numeric(row$fillOpacity), 
                                          weight = 0.5,
                                          options = list(mx_layerId = row$Layer, className = row$ClassName))
    }
  
  #Note that this statement is only effective in standalone R
  print(introMap) 
  

}

mx_intro_map()
