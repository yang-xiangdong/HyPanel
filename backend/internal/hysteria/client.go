package hysteria

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

type UserTraffic struct {
	Username      string `json:"username"`
	UploadBytes   int64  `json:"uploadBytes"`
	DownloadBytes int64  `json:"downloadBytes"`
	TotalBytes    int64  `json:"totalBytes"`
	OnlineCount   int    `json:"onlineCount"`
}

func NewClient(baseURL, token string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

type trafficItem struct {
	TX int64 `json:"tx"`
	RX int64 `json:"rx"`
}

type onlineResponse struct {
	Clients int `json:"clients"`
}

func (c *Client) GetTrafficStats() ([]UserTraffic, error) {
	if c.baseURL == "" || c.token == "" {
		return []UserTraffic{}, nil
	}

	trafficMap := map[string]trafficItem{}
	if err := c.getJSON("/traffic", &trafficMap); err != nil {
		return nil, err
	}

	onlineMap := map[string]onlineResponse{}
	if err := c.getJSON("/online", &onlineMap); err != nil {
		return nil, err
	}

	stats := make([]UserTraffic, 0, len(trafficMap))
	for username, item := range trafficMap {
		onlineCount := 0
		if online, ok := onlineMap[username]; ok {
			onlineCount = online.Clients
		}

		stats = append(stats, UserTraffic{
			Username:      username,
			UploadBytes:   item.TX,
			DownloadBytes: item.RX,
			TotalBytes:    item.TX + item.RX,
			OnlineCount:   onlineCount,
		})
	}

	return stats, nil
}

func (c *Client) getJSON(path string, target any) error {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("build request %s: %w", path, err)
	}

	req.Header.Set("Authorization", c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("request %s failed with status %d", path, resp.StatusCode)
	}

	if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
		return fmt.Errorf("decode %s response: %w", path, err)
	}

	return nil
}
