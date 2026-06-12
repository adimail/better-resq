package geo

import (
	"fmt"
	"strings"
)

func BuildPolygonWKT(poly [][][]float64) string {
	var rings []string
	for _, ring := range poly {
		var pts []string
		for _, pt := range ring {
			if len(pt) >= 2 {
				pts = append(pts, fmt.Sprintf("%f %f", pt[0], pt[1]))
			}
		}
		rings = append(rings, "("+strings.Join(pts, ",")+")")
	}
	return "POLYGON(" + strings.Join(rings, ",") + ")"
}
