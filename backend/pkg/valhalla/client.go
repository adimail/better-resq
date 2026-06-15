package valhalla

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type CostingOptions struct {
	Auto struct {
		ExcludePolygons [][][]float64 `json:"exclude_polygons,omitempty"`
	} `json:"auto,omitempty"`
	Pedestrian struct {
		ExcludePolygons [][][]float64 `json:"exclude_polygons,omitempty"`
	} `json:"pedestrian,omitempty"`
}

type RouteRequest struct {
	Locations      []Location     `json:"locations"`
	Costing        string         `json:"costing"`
	CostingOptions CostingOptions `json:"costing_options,omitempty"`
}

type RouteResponse struct {
	Trip struct {
		Legs []struct {
			Shape     string `json:"shape"`
			Maneuvers []struct {
				Instruction string `json:"instruction"`
			} `json:"maneuvers"`
		} `json:"legs"`
		Summary struct {
			Length float64 `json:"length"`
			Time   float64 `json:"time"`
		} `json:"summary"`
	} `json:"trip"`
	Error string `json:"error,omitempty"`
}

func GetRoute(baseURL string, reqBody RouteRequest) (*RouteResponse, error) {
	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(baseURL+"/route", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("valhalla routing error")
	}

	var routeResp RouteResponse
	if err := json.Unmarshal(body, &routeResp); err != nil {
		return nil, err
	}

	return &routeResp, nil
}
