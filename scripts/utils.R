library(sf)

# Attested at https://stackoverflow.com/questions/68478179/how-to-resolve-spherical-geometry-failures-when-joining-spatial-data
sf::sf_use_s2(FALSE)

lat_lon <- function (data) {
  return (st_transform(data, "+proj=longlat +datum=WGS84"))
}

roundmultipolygon <- function (multi, digits) {
  multi <- lapply(multi, function (matrix) {
    matrix <- lapply(matrix, function (coords) {
      round(coords, digits)
    })
  })
  return (st_multipolygon(multi))
}

roundmultilinestring <- function (poly, digits) {
  poly <- lapply(poly, function (matrix) {
    round(matrix, digits)
  })
  return (st_multilinestring(poly))
}

roundpoly <- function (poly, digits) {
  poly <- lapply(poly, function (matrix) {
      round(matrix, digits)
  })
  return (st_polygon(poly))
}

round_sf <- function (fc, digits) {
  # https://gis.stackexchange.com/questions/329110/removing-empty-polygon-from-sf-object-in-r
  #simple  <- fc %>% st_simplify(preserveTopology = TRUE, dTolerance = 0.5) %>% dplyr::filter(!st_is_empty(.))
  simple <- fc;
  geom <- simple$geometry
  rgeom <- lapply(geom, function (one) {
    if (inherits(one, "MULTIPOLYGON")) {
      one <- roundmultipolygon(one, digits)
    } else if (inherits(one, "MULTILINESTRING")) {
      one <- roundmultilinestring(one, digits)
    } else if (inherits(one, "POLYGON")) {
      one <- roundpoly(one, digits)
    } else if (inherits(one, "XY")) {
      one <- round(one)
    } else if (!st_is_empty(one)) {
      stop(paste("I don't know what it is ", class(one)))
    }
  })
  simple$geometry <- st_sfc(rgeom)
  simple
}

mx_read <- function (filename, digits = 5) {
  st_data <- st_read(filename, quiet=TRUE);
  dropped <- st_zm(st_data, drop = T, what = "ZM")
  trans <- lat_lon(dropped);
  rounded <- round_sf(trans, digits);
}

# Attach the region's label as an "mx_regionId" option in the output data
labelToOption <- function (label) {
  return (list(mx_regionId = label))
}
#---------- from Galiano Marine Atlas utils.js----------#

mx_paste <- function(..., sep='') {
  paste(..., sep=sep, collapse=sep)
}

# Attach the region's label as an "mx_regionId" option in the output data
mx_labelToOption <- function (label) {
  return (list(mx_regionId = label))
}

mx_griddedObsToHash <- function (gridded) {
  summarised <- gridded %>% group_by(cell_id) %>% 
    summarize(taxa = paste(sort(unique(scientificName)),collapse=", "))
  hash <- split(x = summarised$taxa, f=summarised$cell_id)
}

mx_writeJSON = function (data, filename) {
  write(jsonlite::toJSON(data, auto_unbox = TRUE, pretty = TRUE), filename)
}

timedFread <- function (toread) {
  start <- Sys.time()
  frame <- data.table::fread(toread)
  end <- Sys.time()
  message("Read ", nrow(frame), " rows from ", toread, " in ", (end - start), "s")
  frame
}
