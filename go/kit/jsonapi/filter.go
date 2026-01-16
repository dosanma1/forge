package jsonapi

import (
	"strings"
)

// filterIncludedRelationships removes relationships from included resources that weren't
// explicitly requested in the include paths.
func filterIncludedRelationships(payload Payloader, includePaths []string) {
	var included []*Node

	// Get the included resources
	switch p := payload.(type) {
	case *OnePayload:
		included = p.Included
	case *ManyPayload:
		included = p.Included
	default:
		return // Unsupported payload type
	}

	if len(included) == 0 {
		return // No included resources to filter
	}

	// Build a map of type -> allowed relationships for that type
	// For example, if we have "authors.books", we need to know that resources of type "authors"
	// should include the "books" relationship
	typeToAllowedRelationships := make(map[string]map[string]bool)

	// Process include paths to determine allowed relationships for each type
	for _, includePath := range includePaths {
		parts := strings.Split(includePath, ".")

		// For each path segment (except the last one), record the relationship that follows it
		for i := 0; i < len(parts)-1; i++ {
			resourceType := parts[i]
			relationshipName := parts[i+1]

			if _, exists := typeToAllowedRelationships[resourceType]; !exists {
				typeToAllowedRelationships[resourceType] = make(map[string]bool)
			}

			// Mark this relationship as allowed for this resource type
			typeToAllowedRelationships[resourceType][relationshipName] = true
		}
	}

	// For each included resource, filter its relationships
	for _, node := range included {
		if node.Relationships == nil {
			continue
		}

		// Get allowed relationships for this node's type
		allowedRelations, hasAllowedRelations := typeToAllowedRelationships[node.Type]

		// If no relationships are explicitly allowed for this type, remove all relationships
		if !hasAllowedRelations || len(allowedRelations) == 0 {
			node.Relationships = make(map[string]interface{})
			continue
		}

		// Only keep the explicitly allowed relationships
		filteredRelationships := make(map[string]interface{})
		for relName, rel := range node.Relationships {
			if allowedRelations[relName] {
				filteredRelationships[relName] = rel
			}
		}
		node.Relationships = filteredRelationships
	}
}
