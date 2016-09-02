package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/strava/go.strava"
)

var authenticator *strava.OAuthAuthenticator
var port int
var userTokens map[int64]string
var store *sessions.CookieStore
var siteURL string
var wd string

func main() {
	flag.StringVar(&siteURL, "site_url", "http://localhost/", "Site URL")
	flag.IntVar(&port, "port", 8080, "HTTP Port")
	flag.IntVar(&strava.ClientId, "id", 0, "Strava Client ID")
	flag.StringVar(&strava.ClientSecret, "secret", "", "Strava Client Secret")
	flag.Parse()

	if strava.ClientId == 0 || strava.ClientSecret == "" {
		fmt.Println("\nPlease provide a Strava App client_id and client_secret.")
		flag.PrintDefaults()
		os.Exit(1)
	}

	wd, _ = os.Getwd()

	// bootstrap auth stuff
	authenticator = &strava.OAuthAuthenticator{
		CallbackURL:            fmt.Sprintf("%s/exchange_token", siteURL),
		RequestClientGenerator: nil,
	}
	userTokens = map[int64]string{}

	// set-up session store, re-use Strava client secret for encoding.
	store = sessions.NewCookieStore([]byte(strava.ClientSecret))

	// setup routing
	r := mux.NewRouter()
	r.HandleFunc("/", getHome)
	r.HandleFunc("/map", getActivityMap)
	r.HandleFunc("/analysis", getAnalysisPage)
	r.HandleFunc("/api/activities", getActivities)
	r.HandleFunc("/api/activities/{activityId}/streams", getActivityStreams)
	path, _ := authenticator.CallbackPath()
	http.HandleFunc(path, authenticator.HandlerFunc(oAuthSuccess, oAuthFailure))
	http.Handle("/", r)
	http.Handle("/assets/", http.FileServer(http.Dir(filepath.Join(wd, "./public"))))

	// listen for incoming connections
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func getHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")

	p := map[string]string{
		"AuthURL": authenticator.AuthorizationURL("state1", strava.Permissions.Public, false),
	}

	t, _ := template.ParseFiles(filepath.Join(wd, "./index.html"))
	t.Execute(w, p)
}

func oAuthSuccess(auth *strava.AuthorizationResponse, w http.ResponseWriter, r *http.Request) {
	// store user token
	userTokens[auth.Athlete.Id] = auth.AccessToken

	// save user id in session
	session, _ := store.Get(r, "auth")
	session.Values["userId"] = auth.Athlete.Id
	session.Save(r, w)

	// redirect to intensity overview page
	http.Redirect(w, r, "/analysis", 302)
}

func oAuthFailure(err error, w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Authorization Failure:\n")
	fmt.Fprint(w, err)
}

func getActivityMap(w http.ResponseWriter, r *http.Request) {
	_, authenticated := getAuthenticatedStravaClient(r)
	if !authenticated {
		http.Redirect(w, r, "/", 301)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	http.ServeFile(w, r, filepath.Join(wd, "./map.html"))
}

func getAnalysisPage(w http.ResponseWriter, r *http.Request) {
	_, authenticated := getAuthenticatedStravaClient(r)
	if !authenticated {
		http.Redirect(w, r, "/", 301)
		return
	}
	w.Header().Set("Content-Type", "text/html")
	http.ServeFile(w, r, filepath.Join(wd, "./analysis.html"))
}

func getActivities(w http.ResponseWriter, r *http.Request) {
	client, _ := getAuthenticatedStravaClient(r)
	service := strava.NewCurrentAthleteService(client)
	activities, _ := service.ListActivities().Do()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activities)
}

func getActivityStreams(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	activityId, _ := strconv.ParseInt(vars["activityId"], 10, 64)
	types := []strava.StreamType{strava.StreamTypes.Location, strava.StreamTypes.HeartRate, strava.StreamTypes.Time}
	client, _ := getAuthenticatedStravaClient(r)
	streams, _ := strava.NewActivityStreamsService(client).Get(activityId, types).Resolution("medium").SeriesType("time").Do()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(streams)
}

func getAuthenticatedStravaClient(r *http.Request) (*strava.Client, bool) {
	userId, authenticated := getAuthenticatedUserId(r)
	client := strava.NewClient(userTokens[userId])
	return client, authenticated
}

func getAuthenticatedUserId(r *http.Request) (int64, bool) {
	session, _ := store.Get(r, "auth")
	userId, authenticated := session.Values["userId"].(int64)

	if authenticated {
		_, authenticated = userTokens[userId]
	}

	return userId, authenticated
}
