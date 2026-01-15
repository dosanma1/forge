package sops

import (
	"encoding/json"
	"testing"

	"github.com/getsops/sops/v3/cmd/sops/formats"
	"github.com/getsops/sops/v3/decrypt"
	"github.com/stretchr/testify/assert/yaml"
)

type sopsVarLoader struct{}

func (l *sopsVarLoader) LoadEnvFromFile(t *testing.T, fPath string) error {
	t.Helper()

	confData, err := decrypt.File(fPath, "")
	if err != nil {
		return err
	}
	vals := map[string]string{}
	if formats.IsYAMLFile(fPath) {
		err = yaml.Unmarshal(confData, &vals)
	} else if formats.IsJSONFile(fPath) {
		err = json.Unmarshal(confData, &vals)
	}
	if err != nil {
		return err
	}
	for k, v := range vals {
		t.Setenv(k, v)
	}

	return nil
}

func NewSOPSEnvVarLoader() *sopsVarLoader {
	return new(sopsVarLoader)
}
