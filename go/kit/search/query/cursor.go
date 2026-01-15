package query

import (
	"context"
	"encoding/base64"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/dosanma1/forge/go/kit/resource"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/reflect/protoreflect"
)

type Cursor interface {
	UUID() string
	CreatedAt() time.Time
	Limit() int
}

type cursor struct {
	createdAt time.Time
	uuid      string
	limit     int
}

func NewCursor(createdAt time.Time, uuid string, limit int) Cursor {
	if uuid == "" || createdAt.IsZero() {
		return nil
	}

	return &cursor{
		uuid:      uuid,
		createdAt: createdAt,
		limit:     limit,
	}
}

func (c *cursor) UUID() string {
	return c.uuid
}

func (c *cursor) CreatedAt() time.Time {
	return c.createdAt
}

func (c *cursor) Limit() int {
	return c.limit
}

var valuesKeyRegexp = regexp.MustCompile(`^(id|created_at)\[(.*)\](.*)$`)

func EncodeCursor(createdAt time.Time, id string, params map[string]string) string {
	keyChain := fmt.Sprintf("created_at[lte]=%s&id[lt]=%s", createdAt.Format(time.RFC3339Nano), id)
	for k, v := range params {
		if k == "cursor" {
			cursorValue := strings.TrimPrefix(v, "cursor=")
			if len(cursorValue) > 1 {
				byt, err := base64.StdEncoding.DecodeString(cursorValue)
				if err != nil {
					// return errors.Internal(fmt.Sprintf("error decoding cursor"), err).Err()
					return ""
				}

				cursorParams := strings.Split(string(byt), "&")
				for _, param := range cursorParams {
					if !valuesKeyRegexp.Match([]byte(param)) {
						keyChain = fmt.Sprintf("%s&%s", keyChain, param)
					}
				}

			}
			continue
		}
		keyChain = fmt.Sprintf("%s&%s", keyChain, v)
	}

	return base64.StdEncoding.EncodeToString([]byte(keyChain))
}

func FormatNextURL[R resource.Resource](ctx context.Context, r []R, req protoreflect.ProtoMessage) (nextUrl string) {
	if len(r) > 0 {
		searchById := false
		params := make(map[string]string, 0)
		rft := req.ProtoReflect()
		rft.Range(func(fd protoreflect.FieldDescriptor, v protoreflect.Value) bool {
			if fd.TextName() == "id" {
				searchById = true
				return false
			}

			// Field that support operators
			if fd.IsMap() {
				v.Map().Range(func(mk protoreflect.MapKey, v protoreflect.Value) bool {
					params[fd.TextName()] = fmt.Sprintf("%s[%s]=%s", fd.TextName(), mk.String(), v.String())
					return true
				})
				return true
			}

			params[fd.TextName()] = fmt.Sprintf("%s=%s", fd.TextName(), v.String())

			return true
		})
		if !searchById {
			lastEl := r[len(r)-1]
			cursor := EncodeCursor(lastEl.CreatedAt(), lastEl.ID(), params)

			md, _ := metadata.FromIncomingContext(ctx)
			if md != nil {
				// TODO: Add schema from metadata context
				nextUrl = fmt.Sprintf("http://%s%s?cursor=%s", md["x-forwarded-host"][0], md["x-forwarded-path"][0], cursor)
			}
		}
	}
	return nextUrl
}
