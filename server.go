package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/strava/go.strava"
)

var authenticator *strava.OAuthAuthenticator
var port = 8080
var userTokens map[int64]string
var store *sessions.CookieStore

func main() {
	flag.IntVar(&strava.ClientId, "id", 0, "Strava Client ID")
	flag.StringVar(&strava.ClientSecret, "secret", "", "Strava Client Secret")
	flag.Parse()

	if strava.ClientId == 0 || strava.ClientSecret == "" {
		fmt.Println("\nPlease provide a Strava App client_id and client_secret.")
		flag.PrintDefaults()
		os.Exit(1)
	}

	// bootstrap auth stuff
	authenticator = &strava.OAuthAuthenticator{
		CallbackURL:            fmt.Sprintf("http://localhost:%d/exchange_token", port),
		RequestClientGenerator: nil,
	}
	userTokens = map[int64]string{}

	// set-up session store, re-use Strava client secret for encoding.
	store = sessions.NewCookieStore([]byte(strava.ClientSecret))

	// setup routing
	r := mux.NewRouter()
	r.HandleFunc("/", getHome)
	r.HandleFunc("/map", getActivityMap)
	r.HandleFunc("/intensities", getIntensityOverview)
	r.HandleFunc("/api/activities", getActivities)
	r.HandleFunc("/api/activities/{activityId}/streams", getActivityStreams)
	path, _ := authenticator.CallbackPath()
	http.HandleFunc(path, authenticator.HandlerFunc(oAuthSuccess, oAuthFailure))
	http.Handle("/", r)
	http.Handle("/assets/", http.FileServer(http.Dir("./public")))

	// listen for incoming connections
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func getHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")

	p := map[string]string{
		"AuthURL": authenticator.AuthorizationURL("state1", strava.Permissions.Public, true),
	}
	t, _ := template.ParseFiles("index.html")
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
	http.Redirect(w, r, "/intensities", 302)
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
	http.ServeFile(w, r, "map.html")
}

func getIntensityOverview(w http.ResponseWriter, r *http.Request) {
	_, authenticated := getAuthenticatedStravaClient(r)
	if !authenticated {
		http.Redirect(w, r, "/", 301)
		return
	}
	w.Header().Set("Content-Type", "text/html")
	http.ServeFile(w, r, "intensities.html")
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
