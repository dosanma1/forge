package appinsights

import (
	"fmt"

	"github.com/dosanma1/forge/go/kit/fields"
	"github.com/dosanma1/forge/go/kit/persistence"
)

// Inspired by https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/azuremonitorexporter

func spanServiceAndName(service, name string) string {
	return fmt.Sprintf("[%s] %s", service, name)
}

func spanName(name string, properties map[string]string) string {
	service := "unknown"
	if s, ok := properties[fields.NameService.Merge(fields.NameName).String()]; ok {
		service = s
	}
	if name != "" {
		return spanServiceAndName(service, name)
	} else {
		name = "(no name)"
	}
	if _, ok := properties["http.route"]; ok {
		if method, ok := properties["http.method"]; ok {
			return spanServiceAndName(service, method)
		}
		return spanServiceAndName(service, "UNKNOWN")
	}

	if method, ok := properties["rpc.method"]; ok {
		return spanServiceAndName(service, method)
	}

	if _, ok := properties["rpc.system"]; ok {
		return spanServiceAndName(service, "call to unknown method")
	}

	if id, ok := properties["messaging.message_id"]; ok && id != "" {
		return spanServiceAndName(service, id)
	}

	if _, ok := properties["messaging.system"]; ok {
		return spanServiceAndName(service, "message sent to queue")
	}

	return name
}

func spanURI(properties map[string]string) string {
	if v, ok := properties["http.url"]; ok && v != "" {
		return v
	}

	var uri string
	if v, ok := properties["http.scheme"]; ok && v != "" {
		uri = v + "://"
	}
	if v, ok := properties["http.host"]; ok && v != "" {
		uri += v
	}
	if v, ok := properties["http.target"]; ok {
		uri += v
	}

	if method, ok := properties["rpc.method"]; ok {
		uri = method
		if service, ok := properties[fields.NameService.Merge(fields.NameName).String()]; ok {
			uri = service + "/" + method
		}
		if service, ok := properties["rpc.service"]; ok {
			uri = service + "/" + method
		}
	}

	return uri
}

func spanSource(properties map[string]string) string {
	var source string
	if v, ok := properties["net.peer.name"]; ok {
		source = v
	}
	if v, ok := properties["http.client_ip"]; ok {
		source = v
	}

	return source
}

func spanResponseCode(properties map[string]string) string {
	if v, ok := properties["http.status_code"]; ok {
		return v
	}
	if v, ok := properties["rpc.grpc.status_code"]; ok {
		return v
	}

	return "0"
}

func spanData(name string, properties map[string]string) string {
	data := spanName(name, properties)
	if v, ok := properties["http.url"]; ok {
		data = v
	}
	if v, ok := properties[persistence.SpanAttrStatement.String()]; ok {
		data = v
	}

	return data
}

func spanType(properties map[string]string) string {
	dependencyType := "HTTP"
	if v, ok := properties["rpc.system"]; ok {
		dependencyType = v
	}
	if v, ok := properties["messaging.system"]; ok {
		dependencyType = v
	}
	if v, ok := properties[persistence.SpanAttrSystem.String()]; ok {
		dependencyType = v
	}

	return dependencyType
}

func spanTarget(properties map[string]string) string {
	var target string
	if v, ok := properties["net.peer.name"]; ok {
		target = v
	}
	if v, ok := properties["http.url"]; ok {
		target = v
	}
	if v, ok := properties["http.host"]; ok {
		target = v
	}

	return target
}
