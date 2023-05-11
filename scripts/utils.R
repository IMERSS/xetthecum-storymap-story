library(sf)

lat_lon <- function (data) {
  return (st_transform(data, "+proj=longlat +datum=WGS84"))
}


roundmulti <- function (multi) {
  multi <- lapply(multi, function (matrix) {
    matrix <- lapply(matrix, function (coords) {
      round(coords, 4)
    })
  })
  return (st_multipolygon(multi))
}

roundgeom <- function (geom) {
  geom <- lapply(geom, roundmulti)
  return (st_sfc(geom))
}

mx_read <- function (filename) {
  st_data <- st_read(filename, quiet=TRUE);
  dropped <- st_zm(st_data, drop = T, what = "ZM")
  trans <- lat_lon(dropped);
  geom <- trans$geometry;
  trans$geometry <- roundgeom(geom)
  return(trans)
}

# Attach the region's label as an "mx_regionId" option in the output data
labelToOption <- function (label) {
  return (list(mx_regionId = label))
}

