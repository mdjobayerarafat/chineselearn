package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Models
type Chapter struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	Name         string       `json:"name"`
	Description  string       `json:"description"`
	Vocabularies []Vocabulary `json:"vocabularies,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type Vocabulary struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Chinese   string    `json:"chinese"`
	Pinyin    string    `json:"pinyin"`
	Meaning   string    `json:"meaning"`
	ImageURL  string    `json:"image_url"`
	ChapterID uint      `json:"chapter_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type VocabularyBatchInput struct {
	Chinese  string `json:"chinese"`
	Pinyin   string `json:"pinyin"`
	Meaning  string `json:"meaning"`
	ImageURL string `json:"image_url"`
}

var db *gorm.DB

func main() {
	var err error
	db, err = gorm.Open(sqlite.Open("chineselearn.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	// Migrate the schema
	db.AutoMigrate(&Chapter{}, &Vocabulary{})

	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://20.220.172.139:3000", "http://20.220.172.139"}, // Allow localhost and VPS IP
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Ensure uploads directory exists
	if _, err := os.Stat("uploads"); os.IsNotExist(err) {
		os.Mkdir("uploads", 0755)
	}
	// Serve static files
	r.Static("/uploads", "./uploads")

	// Routes
	api := r.Group("/api")
	{
		api.GET("/chapters", getChapters)
		api.POST("/chapters", createChapter)
		api.PUT("/chapters/:id", updateChapter)
		api.DELETE("/chapters/:id", deleteChapter)
		api.GET("/chapters/:id/vocabularies", getChapterVocabularies)
		api.POST("/vocabularies", createVocabulary)
		api.POST("/chapters/:id/vocabularies/batch", batchCreateVocabularies)
		api.PUT("/vocabularies/:id", updateVocabulary)
		api.DELETE("/vocabularies/:id", deleteVocabulary)
	}

	r.Run(":8080")
}

func getChapters(c *gin.Context) {
	var chapters []Chapter
	if result := db.Find(&chapters); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, chapters)
}

func createChapter(c *gin.Context) {
	var chapter Chapter
	if err := c.ShouldBindJSON(&chapter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if result := db.Create(&chapter); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, chapter)
}

func updateChapter(c *gin.Context) {
	var chapter Chapter
	if err := db.First(&chapter, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chapter.Name = input.Name
	chapter.Description = input.Description

	if result := db.Save(&chapter); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, chapter)
}

func deleteChapter(c *gin.Context) {
	id := c.Param("id")
	// Delete associated vocabularies first
	if result := db.Where("chapter_id = ?", id).Delete(&Vocabulary{}); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result := db.Delete(&Chapter{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Chapter deleted"})
}

func getChapterVocabularies(c *gin.Context) {
	chapterID := c.Param("id")
	var vocabularies []Vocabulary
	if result := db.Where("chapter_id = ?", chapterID).Find(&vocabularies); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, vocabularies)
}

func createVocabulary(c *gin.Context) {
	// Parse multipart form
	chinese := c.PostForm("chinese")
	pinyin := c.PostForm("pinyin")
	meaning := c.PostForm("meaning")
	chapterIDStr := c.PostForm("chapter_id")
	imageLink := c.PostForm("image_url")

	if chinese == "" || chapterIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "chinese and chapter_id are required"})
		return
	}

	chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chapter_id"})
		return
	}

	var finalImageURL string = imageLink

	// Handle file upload if present
	file, err := c.FormFile("image")
	if err == nil {
		// Save the file
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
		dst := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
			return
		}
		// Assuming server runs on localhost:8080/uploads/...
		finalImageURL = "http://localhost:8080/uploads/" + filename
	}

	vocab := Vocabulary{
		Chinese:   chinese,
		Pinyin:    pinyin,
		Meaning:   meaning,
		ImageURL:  finalImageURL,
		ChapterID: uint(chapterID),
	}

	if result := db.Create(&vocab); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, vocab)
}

func updateVocabulary(c *gin.Context) {
	id := c.Param("id")
	var vocab Vocabulary
	if result := db.First(&vocab, id); result.Error != nil {
		fmt.Printf("Vocabulary not found for ID: %s, Error: %v\n", id, result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "Vocabulary not found"})
		return
	}
	fmt.Printf("Found vocabulary: %+v\n", vocab)

	// Parse multipart form
	chinese := c.PostForm("chinese")
	pinyin := c.PostForm("pinyin")
	meaning := c.PostForm("meaning")
	imageLink := c.PostForm("image_url")

	// Update fields if provided
	if chinese != "" {
		vocab.Chinese = chinese
	}
	if pinyin != "" {
		vocab.Pinyin = pinyin
	}
	if meaning != "" {
		vocab.Meaning = meaning
	}

	var finalImageURL string = vocab.ImageURL
	if imageLink != "" {
		finalImageURL = imageLink
	}

	// Handle file upload if present
	file, err := c.FormFile("image")
	if err == nil {
		// Save the file
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
		dst := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
			return
		}
		// Assuming server runs on localhost:8080/uploads/...
		finalImageURL = "http://localhost:8080/uploads/" + filename
	}
	vocab.ImageURL = finalImageURL

	if result := db.Save(&vocab); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, vocab)
}

func deleteVocabulary(c *gin.Context) {
	id := c.Param("id")
	if result := db.Delete(&Vocabulary{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Vocabulary deleted"})
}

func batchCreateVocabularies(c *gin.Context) {
	chapterIDStr := c.Param("id")
	chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid chapter_id"})
		return
	}

	var inputs []VocabularyBatchInput
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(inputs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "empty inputs"})
		return
	}

	var vocabularies []Vocabulary
	for _, input := range inputs {
		vocabularies = append(vocabularies, Vocabulary{
			Chinese:   input.Chinese,
			Pinyin:    input.Pinyin,
			Meaning:   input.Meaning,
			ImageURL:  input.ImageURL,
			ChapterID: uint(chapterID),
		})
	}

	if result := db.Create(&vocabularies); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, vocabularies)
}
