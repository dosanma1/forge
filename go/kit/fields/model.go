// Package fields ...
package fields

import (
	"golang.org/x/text/currency"
)

const (
	NameName              Name = "name"
	NameShortName         Name = "short-name"
	NameAlternateName     Name = "alternate-name"
	NameAppReleaseName    Name = "app-release-name"
	NameDescription       Name = "description"
	NameCountryCode       Name = "country-code"
	NameCurrency          Name = "currency"
	NameVersion           Name = "version"
	NameNotes             Name = "notes"
	NameWebsites          Name = "websites"
	NameValue             Name = "value"
	NameValues            Name = "values"
	NameEmail             Name = "email"
	NameEmails            Name = "email-address"
	NameEmailVerification Name = "emailVerification"
	NameFirstName         Name = "firstName"
	NameLastName          Name = "lastName"
	NameHandler           Name = "handler"
	NameCallback          Name = "callback"
	NameIncoming          Name = "incoming"
	NamePriority          Name = "priority"
	NameActiveSince       Name = "active-since"
	NameCustom            Name = "custom"

	ServiceNameConversation Name = "conversation"
)

type NameProvider interface {
	Name() string
}

type ShortNameProvider interface {
	ShortName() string
}

type FullNameProvider interface {
	FullName() string
}

type AlternateNameProvider interface {
	AlternateName() string
}

type FirstNameProvider interface {
	FirstName() string
}

type LastNameProvider interface {
	LastName() string
}

type EmailProvider interface {
	Email() string
}

type EmailsProvider interface {
	Emails() []string
}

type DescriptionProvider interface {
	Description() string
}

type CountryCodeProvider interface {
	CountryCode() string
}

type CurrencyProvider interface {
	Currency() currency.Unit
}

type VersionProvider interface {
	Version() string
}

type TypeProvider interface {
	Type() string // TODO: Change type to ResourceType
	// https://linear.app/messagemycustomer/issue/MMC-445/[general]-change-type-from-string-to-resourcetype
}

type NotesProvider interface {
	Notes() []string
}

type ValueProvider[T any] interface {
	Value() T
}

type NameSetter interface {
	SetName(name string)
}

type IsZeroChecker interface {
	IsZero() bool
}
