package geo

func DecodePolyline6(encoded string) [][]float64 {
	var polyline [][]float64
	index := 0
	lenStr := len(encoded)
	lat := 0
	lng := 0

	for index < lenStr {
		b := 0
		shift := uint(0)
		result := 0

		for {
			b = int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}

		dlat := result
		if (result & 1) != 0 {
			dlat = ^(result >> 1)
		} else {
			dlat = result >> 1
		}
		lat += dlat

		shift = 0
		result = 0

		for {
			if index >= lenStr {
				break
			}
			b = int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}

		dlng := result
		if (result & 1) != 0 {
			dlng = ^(result >> 1)
		} else {
			dlng = result >> 1
		}
		lng += dlng

		polyline = append(polyline, []float64{float64(lng) / 1e6, float64(lat) / 1e6})
	}

	return polyline
}
