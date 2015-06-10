library(jsonlite)

x <- seq.Date(as.Date("2005-01-01"), as.Date("2016-01-01"), by="month")
y <- seq_along(x)*0.2 + 100 + rnorm(length(x))*10

d <- data.frame(date=x, y=y)
d$date <- format(d$date, "%YM%m")

writeLines(toJSON(d, pretty=T), con="data.json")

