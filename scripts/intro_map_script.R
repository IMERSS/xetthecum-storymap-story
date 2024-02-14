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
polygonStyling <- timedFread("tabular_data/polygonStyling.csv")
lineStyling <- timedFread("tabular_data/lineStyling.csv")


mx_intro_map <- function () {
  title <- "Xetthecum Introduction";
  
  # Plot map
  introMap <- leaflet(options=list(mx_mapId="Introduction")) %>%
    fitBounds(-123.51834, 48.93672,-123.49091, 48.95141) %>%
    addProviderTiles(providers$CartoDB.Positron)
    
    for (i in 1:nrow(polygonStyling)) {
      row <- polygonStyling[i,]
      introMap <- introMap %>% addPolygons(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                          fillColor = row$fillColor, 
                                          fillOpacity = as.numeric(row$fillOpacity), 
                                          stroke=TRUE,
                                          color=row$outlineColor,
                                          opacity=row$outlineOpacity,
                                          weight = row$outlineWidth,
                                          options = list(mx_layerId = row$Layer, className = row$ClassName))
    }
  
    for (i in 1:nrow(lineStyling)) {
      row <- lineStyling[i,]
      introMap <- introMap %>% addPolylines(data = mx_read(paste("spatial_data/vectors/",row$Layer, sep="")), 
                                           stroke=TRUE,
                                           color=row$outlineColor,
                                           opacity=as.numeric(row$outlineOpacity),
                                           weight = as.numeric(row$outlineWidth),
                                           options = list(mx_layerId = row$Layer, className = row$ClassName))
    }
  
  #Note that this statement is only effective in standalone R
  print(introMap) 
  

}

mx_intro_map()
